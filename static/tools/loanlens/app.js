import { comparePlan, goalAnalysis, repaymentOptions } from './engine.js';
import { defaultScenario, validatePlan, InputError } from './plan.js';
import { createBrowserStore } from './browser-store.js';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const clone = (value) => structuredClone(value);
const rupees = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });
const monthFormat = new Intl.DateTimeFormat('en-IN', { month: 'short', year: 'numeric', timeZone: 'UTC' });
const PAGE_SIZE = 24;
const isCanvas = document.documentElement.dataset.storage === 'canvas';
const storageKey = `home-loan-lab:v1:${new URL('.', document.baseURI).pathname}`;
const browserStore = isCanvas ? null : createBrowserStore({
  key: storageKey,
  withLock: (action) => navigator.locks ? navigator.locks.request(storageKey, action) : Promise.resolve().then(action),
});
let plan = null;
let revision = 0;
let editVersion = 0;
let persistedVersion = 0;
let saveTimer;
let computeTimer;
let savePromise = null;
let replacing = false;
let blocked = null;
let comparisons = [];
let analysis = null;
let calculatedVersion = -1;
let currentTab = 'plan';
let frequency = 'yearly';
let page = 0;
let pendingConfirmation = null;
let printDetailsState = [];
let invalidField = null;

function element(tag, className = '', text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = String(text);
  return node;
}

function money(value) {
  return Number.isFinite(value) ? rupees.format(value) : '—';
}

function compact(value) {
  if (!Number.isFinite(value)) return '—';
  const magnitude = Math.abs(value);
  if (magnitude >= 10000000) return `₹${decimal.format(value / 10000000)} cr`;
  if (magnitude >= 100000) return `₹${decimal.format(value / 100000)} lakh`;
  return money(value);
}

function duration(months) {
  if (!Number.isFinite(months)) return 'Not reached';
  const whole = Math.max(0, Math.round(months));
  const years = Math.floor(whole / 12);
  const rest = whole % 12;
  return [years ? `${years}y` : '', rest ? `${rest}m` : ''].filter(Boolean).join(' ') || '0m';
}

function readableDuration(months) {
  if (!Number.isFinite(months)) return 'Not reached';
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return [years ? `${years} year${years === 1 ? '' : 's'}` : '', rest ? `${rest} month${rest === 1 ? '' : 's'}` : ''].filter(Boolean).join(' ') || '0 months';
}

function dateAt(month) {
  if (!plan || !Number.isFinite(month) || !/^\d{4}-(0[1-9]|1[0-2])$/.test(plan.firstPaymentMonth)) return '—';
  const [year, start] = plan.firstPaymentMonth.split('-').map(Number);
  return monthFormat.format(new Date(Date.UTC(year, start - 1 + month - 1, 1)));
}

function isoDateAt(month) {
  const [year, start] = plan.firstPaymentMonth.split('-').map(Number);
  return new Date(Date.UTC(year, start - 1 + month - 1, 1)).toISOString().slice(0, 7);
}

function selectedScenario() {
  return plan?.scenarios.find((scenario) => scenario.id === plan.selectedId);
}

function selectedComparison() {
  return comparisons.find((entry) => entry.scenario.id === plan?.selectedId);
}

function getAt(object, path) {
  return path.split('.').reduce((value, key) => value?.[key], object);
}

function setAt(object, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  const parent = keys.reduce((current, key) => current[key], object);
  parent[last] = value;
}

function sourceFor(scope) {
  if (scope === 'scenario') return selectedScenario();
  if (scope === 'goals') return plan.goals;
  return plan;
}

function setStatus(message, state = '') {
  const node = $('#save-status');
  node.textContent = message;
  node.dataset.state = state;
}

function setSavedStatus() {
  setStatus(isCanvas ? 'Saved locally' : browserStore.persistent ? 'Saved on this device' : 'Temporary plan', isCanvas || browserStore.persistent ? 'saved' : 'temporary');
}

function syncStorageUI() {
  $('#browser-privacy').hidden = isCanvas;
  $('#clear-device-data').hidden = isCanvas;
  if (isCanvas) {
    $('#data-policy').textContent = 'This Copilot preview saves plans to a private local file. The downloadable website is separate: it includes only generic examples, with optional on-device saving for each visitor. Download scenarios for a backup; exported files contain the amounts you entered.';
    return;
  }
  if (!replacing) $('#remember-device').checked = browserStore.persistent;
  $('#remember-device').disabled = replacing || !browserStore.storageAvailable;
  $('#storage-warning').hidden = !browserStore.warning;
  $('#storage-warning').textContent = browserStore.warning || '';
}

function announce(message) {
  $('#action-status').textContent = message;
}

function setBusy(value) {
  replacing = value;
  $('#workbench').disabled = value || !plan;
  for (const id of ['export-plan', 'import-plan', 'reload-plan', 'print-plan', 'import-file', 'recover-disk', 'retry-save', 'reset-scenario', 'clear-device-data']) {
    $(`#${id}`).disabled = value;
  }
  syncStorageUI();
}

function showStorageError(error, conflict = false) {
  blocked = conflict ? 'conflict' : 'error';
  $('#storage-error-text').textContent = conflict
    ? 'The saved scenarios changed in another window. Your edits have not overwritten them. Download your scenarios to keep a copy, then reload the saved version before making further saves.'
    : `${error.message || 'Could not reach the local plan store.'} Your current edits remain in this window. Retry, or export JSON before reloading.`;
  $('#storage-error').hidden = false;
  $('#retry-save').hidden = conflict || !plan;
  setStatus(conflict ? 'Saved-plan conflict' : 'Not saved', 'error');
}

function clearStorageError() {
  blocked = null;
  $('#storage-error').hidden = true;
}

function showInputError(message) {
  $('#input-error-text').textContent = message;
  $('#input-error').hidden = !message;
}

function suspendResults() {
  comparisons = [];
  analysis = null;
  calculatedVersion = -1;
  $('#workbench').dataset.resultsState = 'paused';
  $('#print-schedule').replaceChildren();
}

function validDraft({ show = true } = {}) {
  if (!plan) return false;
  let firstInvalid = null;
  for (const input of $$('input[data-path]')) {
    const invalid = !input.validity.valid;
    input.setAttribute('aria-invalid', String(invalid));
    if (invalid && !firstInvalid) firstInvalid = input;
  }
  try {
    validatePlan(plan);
    if (firstInvalid) {
      const label = firstInvalid.labels?.[0]?.textContent || 'Input';
      throw new InputError(`${label.trim()}: ${firstInvalid.validationMessage}`);
    }
    if (show) showInputError('');
    invalidField = null;
    $('#fix-input').hidden = true;
    return true;
  } catch (error) {
    if (show) {
      suspendResults();
      showInputError(`${error.message} Results are paused and these edits are not saved.`);
      invalidField = firstInvalid;
      $('#fix-input').hidden = !invalidField;
      $('#result-freshness').textContent = 'Results paused · check inputs';
      setStatus('Fix inputs to save', 'error');
    }
    return false;
  }
}

async function requestState(method = 'GET', body) {
  if (!isCanvas) return method === 'GET' ? browserStore.load() : browserStore.save(body.revision, body.plan);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(new URL('api/state', document.baseURI), {
      method,
      cache: 'no-store',
      credentials: 'same-origin',
      signal: controller.signal,
      ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
    });
    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error(`The local server returned an unreadable response (${response.status}).`);
    }
    if (!response.ok) {
      const error = new Error(typeof data.error === 'string' ? data.error : `Local storage returned ${response.status}.`);
      error.status = response.status;
      throw error;
    }
    if (!Number.isSafeInteger(data.revision) || data.revision < 0) throw new Error('The local server returned an invalid plan revision.');
    validatePlan(data.plan);
    return data;
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('The local storage request timed out.');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function scheduleSave() {
  clearTimeout(saveTimer);
  if (blocked || replacing || !validDraft({ show: false })) return;
  saveTimer = setTimeout(() => void saveDraft(), 650);
}

async function saveDraft() {
  clearTimeout(saveTimer);
  if (savePromise || replacing || blocked || !validDraft({ show: false }) || editVersion === persistedVersion) return;
  const snapshot = clone(plan);
  const snapshotVersion = editVersion;
  const snapshotRevision = revision;
  setStatus(isCanvas || browserStore.persistent ? 'Saving…' : 'Updating…', 'saving');
  // Responses only advance the revision. They never replace newer edits in the form.
  savePromise = (async () => {
    try {
      const data = await requestState('PUT', { revision: snapshotRevision, plan: snapshot });
      revision = data.revision;
      persistedVersion = snapshotVersion;
      clearStorageError();
      if (!validDraft({ show: false })) {
        setStatus('Fix inputs to save', 'error');
      } else {
        if (editVersion === persistedVersion) setSavedStatus();
        else setStatus('Unsaved edits');
      }
    } catch (error) {
      showStorageError(error, error.status === 409);
    }
  })();
  await savePromise;
  savePromise = null;
  // Only one request is in flight. A changed snapshot is queued after its predecessor.
  if (!blocked && !replacing && editVersion !== persistedVersion) scheduleSave();
}

function cancelPendingWork() {
  clearTimeout(saveTimer);
  clearTimeout(computeTimer);
}

function adoptRecord(data) {
  plan = clone(data.plan);
  revision = data.revision;
  editVersion = persistedVersion = 0;
  calculatedVersion = -1;
  page = 0;
  clearStorageError();
  showInputError('');
  cancelPendingWork();
  syncEditors();
  recompute();
  syncStorageUI();
  setSavedStatus();
}

async function loadPlan({ initial = false } = {}) {
  cancelPendingWork();
  setBusy(true);
  setStatus('Loading scenarios…');
  if (savePromise) await savePromise;
  try {
    const data = await requestState();
    adoptRecord(data);
    announce(initial ? 'Your calculator is ready.' : 'The latest saved scenarios have been loaded.');
  } catch (error) {
    showStorageError(error, error.status === 409);
    if (!plan) {
      $('#storage-error-text').textContent = `${error.message} Saved scenarios could not be loaded and have not been overwritten. Retry loading${isCanvas ? '.' : ', or use “Clear calculator data” to start fresh.'}`;
      $('#recover-disk').textContent = 'Retry loading';
    }
  } finally {
    setBusy(false);
  }
}

function confirmAction(message, label, action) {
  pendingConfirmation = action;
  $('#confirm-text').textContent = message;
  $('#confirm-yes').textContent = label;
  $('#action-confirm').hidden = false;
  $('#confirm-yes').focus();
}

function requestReload() {
  if (replacing) return;
  const reload = () => void loadPlan();
  if (plan && (editVersion !== persistedVersion || blocked)) {
    confirmAction('Reloading replaces the scenarios in this window with the last saved version. Download your scenarios first to keep unsaved edits.', 'Discard edits & reload', reload);
  } else {
    reload();
  }
}

async function importPlan(file) {
  if (!file || replacing) return;
  try {
    if (file.size > 500000) throw new InputError('Choose a scenarios file smaller than 500 KB.');
    const imported = JSON.parse(await file.text());
    validatePlan(imported);
    if (blocked === 'conflict') throw new InputError('Reload the conflicting saved scenarios before importing. Download your current scenarios first if needed.');
    confirmAction(`Replace the current scenarios with “${file.name}”? Download your current scenarios first if you need a backup.`, 'Open scenarios', async () => {
      cancelPendingWork();
      setBusy(true);
      if (savePromise) await savePromise;
      if (blocked === 'conflict') {
        setBusy(false);
        return;
      }
      setStatus('Opening scenarios…', 'saving');
      try {
        const data = await requestState('PUT', { revision, plan: imported });
        adoptRecord(data);
        announce(isCanvas || browserStore.persistent ? 'Imported scenarios saved locally.' : 'Imported scenarios opened for this tab only.');
      } catch (error) {
        showStorageError(error, error.status === 409);
      } finally {
        setBusy(false);
      }
    });
  } catch (error) {
    showInputError(`Import not applied: ${error.message}`);
  }
}

function markChanged({ structure = false } = {}) {
  editVersion += 1;
  calculatedVersion = -1;
  clearTimeout(saveTimer);
  clearTimeout(computeTimer);
  if (structure) syncEditors();
  updateHints();
  updateScenarioOptions();
  if (!validDraft()) return;
  if (!blocked) setStatus(savePromise ? 'Saving · more edits queued' : 'Unsaved edits', savePromise ? 'saving' : '');
  $('#result-freshness').textContent = 'Updating…';
  computeTimer = setTimeout(recompute, 170);
  scheduleSave();
}

function changeStructure(action) {
  if (replacing || !validDraft()) return;
  action();
  page = 0;
  markChanged({ structure: true });
}

function updateScenarioOptions() {
  if (!plan) return;
  const select = $('#scenario-select');
  select.replaceChildren(...plan.scenarios.map((scenario) => {
    const option = element('option', '', scenario.name || 'Unnamed scenario');
    option.value = scenario.id;
    return option;
  }));
  select.value = plan.selectedId;
  $('#working-plan-name').textContent = selectedScenario().name || 'Unnamed plan';
  $('#add-scenario').disabled = plan.scenarios.length >= 12;
  $('#clone-scenario').disabled = plan.scenarios.length >= 12;
  $('#delete-scenario').disabled = plan.scenarios.length <= 1;
}

function syncEditors() {
  if (!plan) return;
  renderEventRows();
  for (const input of $$('input[data-path]')) {
    const value = getAt(sourceFor(input.dataset.scope), input.dataset.path);
    input.value = value == null || (typeof value === 'number' && !Number.isFinite(value)) ? '' : String(typeof value === 'number' ? value / Number(input.dataset.scale || 1) : value);
    input.setAttribute('aria-invalid', 'false');
    const hint = input.closest('.field')?.querySelector('.field-hint');
    if (hint) {
      hint.id ||= `${input.id}-hint`;
      input.setAttribute('aria-describedby', hint.id);
    }
  }
  updateScenarioOptions();
  updateHints();
}

function updateHints() {
  const scenario = selectedScenario();
  if (!scenario) return;
  $('#principal-hint').textContent = `${money(scenario.principal)}${Number.isFinite(scenario.principal) ? ` · ${compact(scenario.principal)}` : ''}`;
  $('#annual-date-hint').textContent = /^\d{4}-\d{2}$/.test(plan.firstPaymentMonth) && Number.isFinite(scenario.annualFirstMonth)
    ? `First extra: ${dateAt(scenario.annualFirstMonth)} (month ${scenario.annualFirstMonth}); repeats every 12 months through month ${scenario.annualLastMonth}.`
    : 'Yearly extras repeat every 12 months, after that month’s EMI.';
  for (const button of $$('[data-principal]')) button.setAttribute('aria-pressed', String(Number(button.dataset.principal) === scenario.principal));
  for (const button of $$('[data-annual-extra]')) button.setAttribute('aria-pressed', String(Number(button.dataset.annualExtra) === scenario.annualPrepayment));
  for (const button of $$('[data-tenure]')) button.setAttribute('aria-pressed', String(Number(button.dataset.tenure) === scenario.tenureYears));
  $('#annual-timing').value = [1, 6, 12, 24].includes(scenario.annualFirstMonth) ? String(scenario.annualFirstMonth) : 'custom';
  $('#annual-timing').disabled = scenario.annualPrepayment === 0;
  $('#annual-end').min = String(scenario.annualFirstMonth);
  $('#monthly-end').min = String(scenario.monthlyExtraStart);
  $('#extra-budget-hint').textContent = scenario.annualPrepayment > 0
    ? `${money(scenario.annualPrepayment)} paid yearly, starting ${dateAt(scenario.annualFirstMonth)}. That is about ${money(scenario.annualPrepayment / 12)} per month to set aside${scenario.annualGrowthPercent ? ' in the first year' : ''}, on top of your EMI.`
    : 'No yearly extra. You can still add monthly or one-off payments below.';
  const activeExtras = [];
  if (scenario.monthlyExtra) activeExtras.push(`${money(scenario.monthlyExtra)} / month extra`);
  if (scenario.oneOffs.length) activeExtras.push(`${scenario.oneOffs.length} one-off payment${scenario.oneOffs.length === 1 ? '' : 's'}`);
  if (scenario.annualGrowthPercent && scenario.annualPrepayment) activeExtras.push(`${decimal.format(scenario.annualGrowthPercent)}% yearly growth`);
  if (scenario.annualLastMonth < 600 && scenario.annualPrepayment) activeExtras.push(`yearly extras stop after month ${scenario.annualLastMonth}`);
  const active = $('#active-extras');
  active.hidden = !activeExtras.length;
  active.replaceChildren(document.createTextNode(activeExtras.length ? `Also included: ${activeExtras.join(' · ')}. ` : ''));
  const edit = element('button', 'inline-button', 'Edit extras');
  edit.type = 'button';
  edit.dataset.showExtras = 'true';
  active.append(edit);
  renderCashWarnings();
}

function renderCashWarnings() {
  const scenario = selectedScenario();
  if (!scenario) return;
  const goals = plan.goals;
  const messages = [];
  if (Number.isFinite(scenario.principal) && Number.isFinite(goals.propertyPrice) && scenario.principal > goals.propertyPrice) {
    messages.push(`Loan amount ${money(scenario.principal)} exceeds the entered property price ${money(goals.propertyPrice)}. The down-payment / upfront-cash estimate is invalid under this overborrowing assumption, so its cash-needed and shortfall results are withheld. Bank eligibility and lender loan-to-value limits are not modelled.`);
  }
  if (Number.isFinite(goals.availableCash) && Number.isFinite(goals.reserveCash) && goals.reserveCash > goals.availableCash) {
    messages.push(`The protected reserve of ${money(goals.reserveCash)} exceeds available cash of ${money(goals.availableCash)}. You cannot preserve this reserve even before purchasing. The mathematical minimum financing may exceed the property price; this is not a feasible lending offer, and lender limits are not modelled.`);
  }
  if (calculatedVersion === editVersion && Number.isFinite(analysis?.minimumLoan) && Number.isFinite(goals.propertyPrice) && analysis.minimumLoan > goals.propertyPrice && !(goals.reserveCash > goals.availableCash && goals.availableCash !== null)) {
    messages.push(`The minimum financing estimate of ${money(analysis.minimumLoan)} exceeds the entered property price. It does not establish a feasible mortgage: lender limits and eligibility are not modelled.`);
  }
  const warning = $('#cash-feasibility-warning');
  warning.hidden = messages.length === 0;
  warning.replaceChildren();
  if (messages.length) {
    warning.append(element('strong', '', 'Recheck the purchase and cash assumptions'));
    messages.forEach((message) => warning.append(element('p', '', message)));
  }
}

function eventField({ id, label, path, min, max, scale = 1, step = '1' }) {
  const field = element('div', 'field');
  const caption = element('label', '', label);
  caption.htmlFor = id;
  const input = element('input');
  Object.assign(input, { id, type: 'number', min: String(min), max: String(max), step, required: true });
  input.dataset.scope = 'scenario';
  input.dataset.path = path;
  input.dataset.scale = String(scale);
  input.inputMode = step === '1' ? 'numeric' : 'decimal';
  field.append(caption, input);
  return field;
}

function renderEventRows() {
  const scenario = selectedScenario();
  for (const [key, selector, countSelector] of [['oneOffs', '#one-off-rows', '#one-off-count'], ['rateChanges', '#rate-change-rows', '#rate-change-count']]) {
    const container = $(selector);
    container.replaceChildren();
    $(countSelector).textContent = scenario[key].length ? `(${scenario[key].length})` : '';
    if (!scenario[key].length) container.append(element('p', 'empty-list', key === 'oneOffs' ? 'No one-off payments.' : 'No future rate changes. The starting rate stays constant.'));
    scenario[key].forEach((_, index) => {
      const row = element('div', 'event-row');
      const prefix = `${key}-${index}`;
      row.append(eventField({ id: `${prefix}-month`, label: 'Loan month', path: `${key}.${index}.month`, min: key === 'oneOffs' ? 1 : 2, max: 600 }));
      row.append(key === 'oneOffs'
        ? eventField({ id: `${prefix}-amount`, label: 'Extra (₹ lakh)', path: `${key}.${index}.amount`, min: 0, max: 10000, scale: 100000, step: 'any' })
        : eventField({ id: `${prefix}-rate`, label: 'New rate (% p.a.)', path: `${key}.${index}.annualRate`, min: 0, max: 30, step: 'any' }));
      const remove = element('button', 'quiet-danger', '×');
      remove.type = 'button';
      remove.setAttribute('aria-label', `Remove ${key === 'oneOffs' ? 'one-off payment' : 'rate change'} ${index + 1}`);
      remove.dataset.removeEvent = key;
      remove.dataset.index = String(index);
      row.append(remove);
      container.append(row);
    });
  }
  $('#add-one-off').disabled = scenario.oneOffs.length >= 100;
  $('#add-rate-change').disabled = scenario.rateChanges.length >= 100;
}

function metric(label, value, note, className = '', title = '') {
  const block = element('dl', `metric ${className}`);
  block.append(element('dt', '', label));
  const amount = element('dd', '', value);
  if (title) amount.title = title;
  block.append(amount);
  if (note) block.append(element('small', '', note));
  return block;
}

function definition(container, rows) {
  container.replaceChildren(...rows.map(([label, value, className]) => {
    const row = element('div', 'definition-row');
    row.append(element('dt', '', label), element('dd', className || '', value));
    return row;
  }));
}

function recompute() {
  clearTimeout(computeTimer);
  if (!validDraft()) return;
  try {
    comparisons = comparePlan(plan);
    analysis = goalAnalysis(selectedScenario(), plan.goals);
    renderSummary();
    renderBalanceChart();
    renderComparison();
    renderGoals();
    renderSchedule();
    calculatedVersion = editVersion;
    $('#workbench').dataset.resultsState = 'ready';
    renderCashWarnings();
    $('#result-freshness').textContent = 'Live calculation';
  } catch (error) {
    suspendResults();
    showInputError(`Could not calculate this plan: ${error.message}. Your inputs have been kept.`);
    $('#result-freshness').textContent = 'Calculation unavailable';
  }
}

function renderSummary() {
  const entry = selectedComparison();
  if (!entry) return;
  const { scenario, result, baseline, interestSaved, monthsSaved, netSavings } = entry;
  const horizon = result.paidOff ? 'over the full loan' : `projected over ${duration(result.months)}`;
  $('#result-name').textContent = 'Your result';
  $('#summary-metrics').replaceChildren(
    metric('Monthly EMI', money(result.emi), 'Your regular payment, before extras'),
    metric(result.paidOff ? 'Loan finishes in' : 'Payoff not reached', result.paidOff ? readableDuration(result.months) : '> 100 years', result.paidOff ? `${result.months === scenario.tenureYears * 12 ? 'Final payment' : `Original tenure: ${scenario.tenureYears} years`} · ${dateAt(result.months)}` : `${compact(result.remainingBalance)} still outstanding`, result.paidOff ? 'payoff' : ''),
    metric('Total interest you pay', compact(result.totalInterest), horizon, 'interest-total', money(result.totalInterest)),
  );
  $('#quick-emi').textContent = money(result.emi);
  $('#quick-payoff').textContent = result.paidOff ? duration(result.months) : 'Not reached';
  $('#quick-interest').textContent = compact(result.totalInterest);
  $('#result-assumptions').textContent = `${scenario.rateChanges.length ? `${scenario.rateChanges.length} future rate change(s) included.` : `${decimal.format(scenario.annualRate)}% interest assumed throughout.`} ${result.totalFees ? `${money(result.totalFees)} in fees and tax, paid separately.` : 'No fees entered yet; add your lender’s charges under Optional settings.'}`;
  const warning = $('#amortization-warning');
  warning.replaceChildren();
  warning.hidden = !result.nonAmortizingMonths && result.paidOff;
  if (!warning.hidden) {
    warning.append(element('strong', '', result.paidOff ? 'Some EMIs do not cover monthly interest.' : 'This plan does not finish within the 100-year model limit.'));
    const messages = [];
    if (result.nonAmortizingMonths) messages.push(`In ${result.nonAmortizingMonths} month(s), the original EMI is at or below interest. Unpaid interest may increase the balance unless extras cover it.`);
    if (!result.paidOff) messages.push(`Remaining balance: ${money(result.remainingBalance)}. Totals below are projections, not lifetime costs; no payoff or savings is claimed.`);
    warning.append(element('p', '', messages.join(' ')));
  }
  const savings = $('#savings-sentence');
  savings.classList.toggle('negative', Number.isFinite(netSavings) && netSavings < 0);
  if (result.paidOff && baseline.paidOff && Number.isFinite(netSavings)) {
    const time = Number.isFinite(monthsSaved) ? (monthsSaved >= 0 ? `${readableDuration(monthsSaved)} sooner` : `${readableDuration(-monthsSaved)} later`) : 'time difference unavailable';
    savings.textContent = monthsSaved === 0 && Math.abs(netSavings) < 0.01
      ? 'This is the regular EMI schedule. Add an extra payment above to see the interest and time you could save.'
      : `Your extra payments ${netSavings >= 0 ? 'save' : 'cost an additional'} ${compact(Math.abs(netSavings))} in interest + fees. You finish ${time} than this same loan without extras.`;
  } else {
    savings.textContent = 'Savings comparison unavailable: this plan or its no-extra-payment baseline does not reach payoff within 100 years.';
  }
  const first = result.rows[0];
  $('#first-payment-story').textContent = first
    ? `In ${dateAt(1)}, ${money(first.interest)} accrues as interest. Of the ${money(first.regularPayment)} regular payment, ${money(first.regularPrincipal)} reduces principal.${first.capitalizedInterest > 0 ? ` Unpaid interest of ${money(first.capitalizedInterest)} is added to the balance.` : ''}${first.prepayment > 0 ? ` An additional ${money(first.prepayment)} goes to principal that month.` : ''}`
    : 'There are no payment rows for this scenario.';
  definition($('#cash-burden'), [
    ['EMI + scheduled monthly extra', money(result.emi + scenario.monthlyExtra)],
    ['First loan-year cash', money(result.firstYearCash)],
    ['Peak loan-year cash', money(result.peakYearCash)],
    ['Upfront fees & tax', money(result.upfrontFees)],
    ['Total extra principal actually paid', money(result.totalPrepayment)],
    ['Extra requested beyond the balance', money(result.unusedPrepayment)],
  ]);
  renderCost(result, scenario);
}

function svgElement(tag, attributes = {}, text) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, String(value));
  if (text !== undefined) node.textContent = String(text);
  return node;
}

function renderBalanceChart() {
  if (!comparisons.length) return;
  const all = $('#chart-all').checked;
  const selected = selectedComparison();
  const entries = all ? comparisons : [
    { scenario: { ...selected.scenario, id: 'without-extras', name: 'Without extra payments' }, result: selected.baseline },
    selected,
  ];
  const ordered = [...entries].sort((a, b) => Number(a.scenario.id === plan.selectedId) - Number(b.scenario.id === plan.selectedId));
  const width = 620;
  const height = 250;
  const plot = { left: 58, right: 12, top: 16, bottom: 32 };
  const plotWidth = width - plot.left - plot.right;
  const plotHeight = height - plot.top - plot.bottom;
  const maxMonth = Math.max(12, ...entries.map(({ result }) => result.months));
  const maxBalance = Math.max(1, ...entries.map(({ scenario, result }) => Math.max(scenario.principal, ...result.rows.map((row) => row.closingBalance))));
  const x = (month) => plot.left + month / maxMonth * plotWidth;
  const y = (balance) => plot.top + (1 - balance / maxBalance) * plotHeight;
  const svg = svgElement('svg', { viewBox: `0 0 ${width} ${height}`, role: 'img', 'aria-labelledby': 'balance-title balance-desc' });
  svg.append(svgElement('title', { id: 'balance-title' }, 'Outstanding loan balance over time'));
  svg.append(svgElement('desc', { id: 'balance-desc' }, entries.map(({ scenario, result }) => `${scenario.name}: ${result.paidOff ? `paid off in ${duration(result.months)}` : `${money(result.remainingBalance)} remaining after ${duration(result.months)}`}.`).join(' ')));
  for (let tick = 0; tick <= 4; tick += 1) {
    const balance = maxBalance * tick / 4;
    svg.append(svgElement('line', { x1: plot.left, y1: y(balance), x2: width - plot.right, y2: y(balance), class: 'chart-grid' }));
    const balanceLabel = balance >= 100000000000 ? `${(balance / 10000000).toExponential(1)}Cr` : compact(balance).replace(' lakh', 'L').replace(' cr', 'Cr');
    svg.append(svgElement('text', { x: plot.left - 8, y: y(balance) + 3, 'text-anchor': 'end', class: 'chart-axis' }, balanceLabel));
    const month = maxMonth * tick / 4;
    svg.append(svgElement('text', { x: x(month), y: height - 9, 'text-anchor': tick === 4 ? 'end' : tick === 0 ? 'start' : 'middle', class: 'chart-axis' }, tick === 0 ? 'Start' : `${decimal.format(month / 12)}y`));
  }
  for (const { scenario, result } of ordered) {
    const index = scenario.id === 'without-extras' ? 5 : plan.scenarios.findIndex((item) => item.id === scenario.id);
    const points = [[0, scenario.principal]];
    const stride = Math.max(1, Math.ceil(result.rows.length / 400));
    result.rows.forEach((row, offset) => {
      if (offset % stride === 0 || offset === result.rows.length - 1) points.push([row.month, row.closingBalance]);
    });
    const path = points.map(([month, balance], index) => `${index ? 'L' : 'M'}${x(month).toFixed(2)},${y(balance).toFixed(2)}`).join(' ');
    svg.append(svgElement('path', {
      d: path,
      class: `chart-line series-${index % 6}${scenario.id === plan.selectedId ? ' selected' : ''}`,
      ...(index >= 6 || scenario.id === 'without-extras' ? { 'stroke-dasharray': '5 4' } : {}),
    }));
  }
  $('#balance-chart').replaceChildren(svg);
  $('#chart-legend').replaceChildren(...entries.map(({ scenario }) => {
    const index = scenario.id === 'without-extras' ? 5 : plan.scenarios.findIndex((item) => item.id === scenario.id);
    const label = element('span', `legend-item${scenario.id === plan.selectedId ? ' selected' : ''}`);
    label.append(element('span', `legend-swatch series-${index % 6}${index >= 6 || scenario.id === 'without-extras' ? ' dashed' : ''}`), document.createTextNode(scenario.id === plan.selectedId ? 'Your plan' : scenario.name));
    return label;
  }));
}

function renderCost(result, scenario) {
  const parts = result.paidOff
    ? [['Principal borrowed', scenario.principal, 'principal'], ['Interest', result.totalInterest, 'interest'], ['Fees & tax', result.totalFees, 'fees']]
    : [['Regular payments', result.totalRegularPayments, 'principal'], ['Extra payments', result.totalPrepayment, 'interest'], ['Fees & tax', result.totalFees, 'fees']];
  const total = parts.reduce((sum, part) => sum + part[1], 0);
  const svg = svgElement('svg', { viewBox: '0 0 600 24', role: 'img', 'aria-label': parts.map(([label, value]) => `${label}: ${money(value)}`).join('. '), preserveAspectRatio: 'none' });
  let offset = 0;
  for (const [, value, className] of parts) {
    const width = total > 0 ? value / total * 600 : 0;
    svg.append(svgElement('rect', { x: offset, y: 0, width, height: 24, class: `cost-${className}` }));
    offset += width;
  }
  $('#cost-chart').replaceChildren(svg);
  $('#cost-total').textContent = `${compact(result.totalCashOutflow)} cash out${result.paidOff ? '' : ' · projection only'}`;
  $('#cost-total').title = money(result.totalCashOutflow);
  $('#cost-breakdown').replaceChildren(...parts.map(([label, value, className]) => {
    const item = element('div', 'cost-item');
    const caption = element('dt');
    caption.append(element('span', `cost-swatch cost-${className}`), document.createTextNode(label));
    item.append(caption, element('dd', '', money(value)));
    return item;
  }));
  const fees = result.feeBreakdown;
  definition($('#fee-breakdown'), [
    ['Processing, before tax', money(fees.processing)],
    ['Other upfront, all-in', money(fees.otherUpfront)],
    ['Annual charges, before tax', money(fees.annual)],
    ['Prepayment charges, before tax', money(fees.prepayment)],
    ['Tax on modelled fees', money(fees.tax)],
    ['Total fees & tax', money(result.totalFees)],
  ]);
}

function tableCell(value, detail = '', className = '') {
  const cell = element('td', className, value);
  if (detail) cell.append(element('span', 'cell-detail', detail));
  return cell;
}

function renderComparison() {
  const selected = selectedScenario();
  const selectedResult = selectedComparison().result;
  const options = repaymentOptions(selected);
  $('#quick-comparison-context').textContent = `${money(selected.principal)} borrowed at ${decimal.format(selected.annualRate)}% starting interest. Change the loan amount in Calculator and every option below updates together.`;
  $('#current-comparison').textContent = `Your current plan: ${money(selectedResult.emi)} EMI / month · ${selectedResult.paidOff ? `finished in ${readableDuration(selectedResult.months)}` : 'payoff not reached'} · ${compact(selectedResult.totalInterest)} ${selectedResult.paidOff ? 'total interest' : 'interest projected to 100 years'}.`;
  $('#options-overview tbody').replaceChildren(...options.map(({ scenario, result, current }) => {
    const row = element('tr', current ? 'selected' : '');
    const name = element('th', '', `${scenario.tenureYears} years`);
    name.scope = 'row';
    name.append(element('span', 'cell-detail', scenario.annualPrepayment ? `+ ${compact(scenario.annualPrepayment)} / year` : 'No extras'));
    const emi = tableCell(compact(result.emi));
    emi.title = money(result.emi);
    const interest = tableCell(compact(result.totalInterest), result.paidOff ? '' : 'Projection');
    interest.title = money(result.totalInterest);
    row.append(name, emi, tableCell(result.paidOff ? duration(result.months) : 'Not reached'), interest);
    return row;
  }));
  $('#repayment-options').replaceChildren(...options.map(({ key, label, scenario, result, current }) => {
    const card = element('article', `option-card${current ? ' current' : ''}`);
    card.dataset.optionKey = key;
    card.append(element('h3', '', label), element('p', 'option-subtitle', scenario.annualPrepayment ? `${compact(scenario.annualPrepayment)} extra at each year-end` : 'Only regular monthly EMIs'));
    const values = element('dl', 'definition-list');
    definition(values, [
      ['Monthly EMI', money(result.emi)],
      ['Loan finishes in', result.paidOff ? readableDuration(result.months) : 'Not reached'],
      ['Total interest', compact(result.totalInterest)],
      ['Fees & tax', money(result.totalFees)],
      ['Total paid, including principal', compact(result.totalCashOutflow)],
    ]);
    card.append(values, element('p', 'option-cash', `Peak cash in a year: ${compact(result.peakYearCash)}`));
    if (!result.paidOff || result.nonAmortizingMonths) {
      card.append(element('p', 'negative', !result.paidOff ? 'Not paid off within 100 years. Figures are projections, not lifetime totals.' : 'Some EMIs do not cover interest; review the rate changes.'));
    }
    const button = element('button', current ? 'current-option' : 'primary', current ? 'Your current setup' : 'Use this option');
    button.type = 'button';
    button.dataset.useOption = key;
    button.disabled = current;
    button.setAttribute('aria-label', current ? `${label}: your current setup` : `Use ${label}`);
    card.append(button);
    return card;
  }));
  const body = $('#comparison-table tbody');
  body.replaceChildren(...comparisons.map(({ scenario, result, netSavings }) => {
    const row = element('tr', scenario.id === plan.selectedId ? 'selected' : '');
    const nameCell = element('th');
    nameCell.scope = 'row';
    const button = element('button', 'table-select', scenario.name);
    button.type = 'button';
    button.dataset.selectScenario = scenario.id;
    button.setAttribute('aria-label', `Edit ${scenario.name}${scenario.id === plan.selectedId ? ', selected scenario' : ''}`);
    nameCell.append(button, element('span', 'cell-detail', `${compact(scenario.principal)} · ${scenario.tenureYears}y · ${decimal.format(scenario.annualRate)}%`));
    row.append(
      nameCell,
      tableCell(money(result.emi)),
      tableCell(result.paidOff ? duration(result.months) : 'Not reached', result.paidOff ? dateAt(result.months) : `${compact(result.remainingBalance)} remains`, result.paidOff ? '' : 'negative'),
      tableCell(money(result.totalInterest), result.paidOff ? '' : '100-year projection'),
      tableCell(money(result.totalFees)),
      tableCell(money(result.totalCashOutflow)),
      tableCell(money(result.paidOff ? netSavings : null), '', Number.isFinite(netSavings) && result.paidOff ? netSavings >= 0 ? 'positive' : 'negative' : ''),
    );
    return row;
  }));
  const warningNames = comparisons.filter(({ result }) => result.nonAmortizingMonths || !result.paidOff).map(({ scenario }) => scenario.name);
  $('#comparison-notes').hidden = !warningNames.length;
  $('#comparison-notes').textContent = warningNames.length ? `Review rate / cash warnings in: ${warningNames.join('; ')}. Some EMIs do not cover interest or payoff is not reached within the model limit.` : '';
}

function targetOption(label, amount, note, targetKind) {
  const node = element('div', 'target-option');
  node.append(element('span', 'target-label', label), element('strong', '', Number.isFinite(amount) ? money(amount) : 'Not solvable'), element('p', '', note));
  if (targetKind) {
    const action = element('button', 'target-action', `Use ${targetKind} target`);
    action.type = 'button';
    action.dataset.targetPlan = targetKind;
    action.disabled = !Number.isFinite(amount);
    action.setAttribute('aria-describedby', `replace-${targetKind}-note`);
    const replacementNote = element('p', 'field-hint', 'Replaces all yearly, monthly and one-off extras in this scenario.');
    replacementNote.id = `replace-${targetKind}-note`;
    node.append(action, replacementNote);
  }
  return node;
}

function applyTarget(targetKind) {
  if (!validDraft()) return;
  if (calculatedVersion !== editVersion) recompute();
  if (calculatedVersion !== editVersion || !analysis) return;
  const amount = targetKind === 'annual' ? analysis.requiredAnnualPrepayment : analysis.requiredMonthlyExtra;
  if (!Number.isFinite(amount)) return;
  changeStructure(() => {
    Object.assign(selectedScenario(), {
      annualPrepayment: targetKind === 'annual' ? amount : 0,
      annualFirstMonth: 12,
      annualLastMonth: 600,
      annualGrowthPercent: 0,
      monthlyExtra: targetKind === 'monthly' ? amount : 0,
      monthlyExtraStart: 1,
      monthlyExtraEnd: 600,
      oneOffs: [],
    });
  });
  announce(`Replaced all extras in the selected scenario with ${money(amount)} ${targetKind === 'annual' ? 'each year, from month 12' : 'each month, from month 1'}. Original tenure, starting rate, future rate changes and fees are unchanged.`);
  showResult();
}

function showResult() {
  openTab('plan');
  $('#result-name').scrollIntoView({ block: 'start' });
}

function showExtras() {
  openTab('plan');
  $('#extra-details').open = true;
  $('#extra-details').scrollIntoView({ block: 'start' });
}

function renderGoals() {
  if (!analysis) return;
  const scenario = selectedScenario();
  const overborrowing = Number.isFinite(plan.goals.propertyPrice) && scenario.principal > plan.goals.propertyPrice;
  $('#target-heading').textContent = `Three alternative paths to ${plan.goals.targetYears} years`;
  $('#target-options').replaceChildren(
    targetOption('Keep EMI + a yearly extra', analysis.requiredAnnualPrepayment, 'Each loan year, starting in month 12. Zero means no extra is needed.', 'annual'),
    targetOption('Keep EMI + a monthly extra', analysis.requiredMonthlyExtra, 'Extra each month, starting in month 1.', 'monthly'),
    targetOption('Use a direct target-tenure EMI', analysis.directTargetEmi, `Total EMI, not an extra; ${decimal.format(scenario.annualRate)}% starting-rate illustration.`),
  );
  definition($('#affordability-results'), [
    ['Minimum loan from available cash', analysis.minimumLoan == null ? 'Enter property price + available cash' : money(analysis.minimumLoan)],
    ['Maximum loan from monthly budget', analysis.maximumLoanForEmiBudget == null ? 'Enter a monthly budget' : money(analysis.maximumLoanForEmiBudget)],
    ['Cash needed for selected loan', overborrowing ? 'Withheld: loan exceeds property price' : analysis.cashRequired == null ? 'Enter property price' : money(analysis.cashRequired), overborrowing ? 'negative' : ''],
    ['Cash shortfall, protecting reserve', overborrowing ? 'Withheld: loan exceeds property price' : analysis.cashShortfall == null ? 'Enter property price + available cash' : money(analysis.cashShortfall), overborrowing || analysis.cashShortfall > 0 ? 'negative' : ''],
  ]);
  const hasRange = Number.isFinite(analysis.minimumLoan) && Number.isFinite(analysis.maximumLoanForEmiBudget);
  const rangeNote = hasRange
    ? analysis.minimumLoan > analysis.maximumLoanForEmiBudget
      ? 'The cash-constrained minimum loan exceeds the monthly-budget maximum: these two boundaries do not overlap. '
      : `The modelled amount range is ${compact(analysis.minimumLoan)}–${compact(analysis.maximumLoanForEmiBudget)}, before bank limits and future-rate stress. `
    : '';
  $('#affordability-note').textContent = `${rangeNote}Minimum loan accounts for entered property and purchase costs, available cash, protected reserve and upfront loan fees. Monthly-budget maximum deducts the planned monthly extra and uses the original tenure / starting rate only; it is not bank eligibility. Cash needed excludes the protected reserve; shortfall includes it.`;
  const verdict = $('#tenure-verdict');
  if (plan.goals.monthlyBudget == null) {
    verdict.textContent = 'Enter a monthly budget to identify the lowest borrowing cost among these tested tenures. An annual budget alone is not enough.';
  } else if (analysis.cheapestFeasibleTenure == null) {
    verdict.textContent = 'No tested tenure both pays off and fits the entered payment budgets. Revisit the amount, extras or cash limits.';
  } else {
    verdict.textContent = `${analysis.cheapestFeasibleTenure} years has the lowest modelled interest + fees among the tested tenures fitting payment budgets before fees. Purchase cash and reserve feasibility are separate. This is a comparison under your inputs, not a recommendation.`;
  }
  $('#tenure-table tbody').replaceChildren(...analysis.tenures.map((item) => {
    const row = element('tr', item.years === analysis.cheapestFeasibleTenure ? 'selected' : '');
    const title = element('th', '', `${item.years} years`);
    title.scope = 'row';
    const fit = tableCell('');
    fit.append(element('span', `fit-label ${item.withinBudget == null ? '' : item.withinBudget ? 'yes' : 'no'}`, item.withinBudget == null ? 'Budget not set' : item.withinBudget ? 'Within budget' : 'Over budget'));
    row.append(title, tableCell(money(item.emi)), tableCell(money(item.monthlyCommitment)), tableCell(item.paidOff ? duration(item.months) : 'Not reached'), tableCell(money(item.borrowingCost), item.paidOff ? '' : '100-year projection'), fit);
    return row;
  }));
}

function renderSchedule() {
  const entry = selectedComparison();
  if (!entry) return;
  const { result, scenario } = entry;
  const isYearly = frequency === 'yearly';
  const data = isYearly ? result.years : result.rows;
  const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE));
  page = Math.max(0, Math.min(page, totalPages - 1));
  const start = page * PAGE_SIZE;
  const visible = data.slice(start, start + PAGE_SIZE);
  $('#schedule-intro').textContent = `${scenario.name} · ${money(scenario.principal)} · first EMI ${dateAt(1)}.${result.paidOff ? ` Final payment ${dateAt(result.months)}.` : ' Not paid off: this is a 100-year projection, not a lifetime schedule.'}`;
  $('#schedule-caption').textContent = isYearly ? 'Loan-year totals · year 1 starts at the first EMI · ₹, rounded' : 'Monthly payments · principal extras are applied after EMI · ₹, rounded';
  $('#schedule-yearly').setAttribute('aria-pressed', String(isYearly));
  $('#schedule-monthly').setAttribute('aria-pressed', String(!isYearly));
  const headers = isYearly
    ? ['Loan year', 'Opening balance', 'Regular payments', 'Regular principal', 'Extra principal', 'Interest', 'Fees & tax', 'Total cash', 'Closing balance']
    : ['Loan month / date', 'Rate', 'Opening balance', 'Interest', 'Regular payment', 'Regular principal', 'Interest added', 'Extra principal', 'Unused extra', 'Fees & tax', 'Total cash', 'Closing balance'];
  const header = element('tr');
  headers.forEach((text) => {
    const th = element('th', '', text);
    th.scope = 'col';
    header.append(th);
  });
  $('#schedule-table thead').replaceChildren(header);
  $('#schedule-table tbody').replaceChildren(...visible.map((item) => {
    const row = element('tr');
    const heading = element('th', '', isYearly ? `Year ${item.year}` : `M${item.month}`);
    heading.scope = 'row';
    heading.append(element('span', 'cell-detail', isYearly ? `${dateAt((item.year - 1) * 12 + 1)} – ${dateAt(Math.min(item.year * 12, result.months))}` : dateAt(item.month)));
    row.append(heading);
    if (isYearly) {
      for (const key of ['openingBalance', 'regularPayments', 'regularPrincipal', 'prepayment', 'interest', 'fees', 'cashOutflow', 'closingBalance']) row.append(tableCell(money(item[key])));
    } else {
      row.append(tableCell(`${decimal.format(item.annualRate)}%`));
      for (const key of ['openingBalance', 'interest', 'regularPayment', 'regularPrincipal', 'capitalizedInterest', 'prepayment', 'unusedExtra', 'fee', 'payment', 'closingBalance']) row.append(tableCell(money(item[key]), '', key === 'capitalizedInterest' && item[key] > 0 ? 'negative' : ''));
    }
    return row;
  }));
  $('#page-prev').disabled = page === 0;
  $('#page-next').disabled = page >= totalPages - 1;
  $('#page-status').textContent = `${data.length ? start + 1 : 0}–${Math.min(start + PAGE_SIZE, data.length)} of ${data.length} ${isYearly ? 'years' : 'months'}`;
  $('#schedule-footer').textContent = `Upfront fees: ${money(result.upfrontFees)}. Regular payments: ${money(result.totalRegularPayments)}. Extra principal: ${money(result.totalPrepayment)}. Total repaid to lender (excluding fees): ${money(result.totalRepaid)}. Remaining balance: ${money(result.remainingBalance)}.`;
}

function selectScenario(id, openEditor = false) {
  if (!plan?.scenarios.some((scenario) => scenario.id === id)) return;
  if (!validDraft()) {
    $('#scenario-select').value = plan.selectedId;
    return;
  }
  changeStructure(() => { plan.selectedId = id; });
  if (openEditor) openTab('plan');
}

function openTab(name, focus = false) {
  if (replacing || !['plan', 'compare', 'goals', 'schedule'].includes(name)) return;
  const changed = currentTab !== name;
  currentTab = name;
  for (const button of $$('[role="tab"]')) {
    const active = button.dataset.tab === name;
    button.setAttribute('aria-selected', String(active));
    button.tabIndex = active ? 0 : -1;
  }
  for (const panel of $$('.tab-panel')) panel.hidden = panel.id !== `panel-${name}`;
  if (focus) $(`#tab-${name}`).focus();
  if (calculatedVersion !== editVersion) recompute();
  if (changed) $('.tabs').scrollIntoView({ block: 'start' });
}

function download(content, filename, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = element('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportPlan() {
  if (replacing || !validDraft()) return;
  download(`${JSON.stringify(plan, null, 2)}\n`, 'loanlens-scenarios.json', 'application/json');
  announce('Scenarios downloaded. The file contains your entered amounts; keep it private.');
}

function csvCell(value) {
  const text = typeof value === 'string' && /^[=+\-@\t\r]/.test(value) ? `'${value}` : String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
}

function exportCsv() {
  if (!validDraft()) return;
  if (calculatedVersion !== editVersion) recompute();
  const entry = selectedComparison();
  if (!entry || calculatedVersion !== editVersion) return;
  const header = ['Loan month', 'Date', 'Loan year', 'Rate percent', 'Opening balance INR', 'Interest INR', 'Regular payment INR', 'Regular principal INR', 'Capitalized interest INR', 'Requested extra INR', 'Extra principal INR', 'Unused extra INR', 'Prepayment fees INR', 'Annual fees INR', 'Fee tax INR', 'Monthly fees INR', 'Upfront fees INR', 'Monthly cash excluding upfront INR', 'Total cash including upfront INR', 'Closing balance INR', 'Cumulative interest INR', 'Cumulative principal INR'];
  const keys = ['annualRate', 'openingBalance', 'interest', 'regularPayment', 'regularPrincipal', 'capitalizedInterest', 'requestedExtra', 'prepayment', 'unusedExtra', 'prepaymentFee', 'annualFee', 'tax', 'fee'];
  const rows = entry.result.rows.map((row) => [
    row.month,
    isoDateAt(row.month),
    row.year,
    ...keys.map((key) => Number.isFinite(row[key]) ? Number(row[key].toFixed(6)) : ''),
    row.month === 1 ? Number(entry.result.upfrontFees.toFixed(6)) : 0,
    Number(row.payment.toFixed(6)),
    Number((row.payment + (row.month === 1 ? entry.result.upfrontFees : 0)).toFixed(6)),
    Number(row.closingBalance.toFixed(6)),
    Number(row.cumulativeInterest.toFixed(6)),
    Number(row.cumulativePrincipal.toFixed(6)),
  ]);
  download(`\uFEFF${[header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')}\r\n`, 'loanlens-monthly-schedule.csv', 'text/csv;charset=utf-8');
  announce(`Exported all ${rows.length} monthly schedule rows.`);
}

function preparePrint() {
  if (!validDraft()) return false;
  if (calculatedVersion !== editVersion) recompute();
  if (calculatedVersion !== editVersion) return false;
  const entry = selectedComparison();
  const root = $('#print-schedule');
  root.replaceChildren(element('h2', '', `Yearly schedule · ${entry.scenario.name}`));
  const table = element('table');
  const header = element('tr');
  for (const title of ['Year', 'Regular payments', 'Extra principal', 'Interest', 'Fees', 'Total cash', 'Closing balance']) {
    const cell = element('th', '', title);
    cell.scope = 'col';
    header.append(cell);
  }
  const thead = element('thead');
  thead.append(header);
  const body = element('tbody');
  entry.result.years.forEach((row) => {
    const tr = element('tr');
    const title = element('th', '', row.year);
    title.scope = 'row';
    tr.append(title);
    for (const key of ['regularPayments', 'prepayment', 'interest', 'fees', 'cashOutflow', 'closingBalance']) tr.append(tableCell(money(row[key])));
    body.append(tr);
  });
  table.append(thead, body);
  root.append(table);
  return true;
}

$('#workbench').addEventListener('input', (event) => {
  const input = event.target.closest('input[data-path]');
  if (!input || replacing || !plan) return;
  let value;
  if (input.type === 'number') {
    value = input.value === '' && input.dataset.nullable === 'true' ? null : input.value === '' ? NaN : Number(input.value) * Number(input.dataset.scale || 1);
  } else {
    value = input.value;
  }
  setAt(sourceFor(input.dataset.scope), input.dataset.path, value);
  markChanged();
});

$('#workbench').addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button || button.disabled || replacing) return;
  if (button.dataset.tab) openTab(button.dataset.tab);
  if (button.dataset.openTab) openTab(button.dataset.openTab, true);
  if (button.dataset.selectScenario) selectScenario(button.dataset.selectScenario, true);
  if (button.dataset.targetPlan) applyTarget(button.dataset.targetPlan);
  if (button.dataset.tenure) changeStructure(() => { selectedScenario().tenureYears = Number(button.dataset.tenure); });
  if (button.dataset.showExtras) showExtras();
  if (button.dataset.useOption) {
    changeStructure(() => {
      const option = repaymentOptions(selectedScenario()).find((item) => item.key === button.dataset.useOption);
      Object.assign(selectedScenario(), option.scenario);
    });
    showResult();
    announce('Updated your current plan. Other saved plans are unchanged.');
  }
  if (button.dataset.principal) changeStructure(() => { selectedScenario().principal = Number(button.dataset.principal); });
  if (button.dataset.annualExtra !== undefined) changeStructure(() => { selectedScenario().annualPrepayment = Number(button.dataset.annualExtra); });
  if (button.dataset.removeEvent) {
    // Removal must remain possible when the row being removed is the invalid input.
    const key = button.dataset.removeEvent;
    const index = Number(button.dataset.index);
    selectedScenario()[key].splice(index, 1);
    markChanged({ structure: true });
  }
  if (button.dataset.frequency) {
    frequency = button.dataset.frequency;
    page = 0;
    renderSchedule();
  }
});

$('#scenario-select').addEventListener('change', (event) => selectScenario(event.target.value));
$('#loan-unit').addEventListener('change', (event) => {
  if (!validDraft()) {
    event.target.value = $('#principal').dataset.scale;
    return;
  }
  const scale = Number(event.target.value);
  $('#principal').dataset.scale = String(scale);
  $('#principal').min = String(1000 / scale);
  $('#principal').max = String(1000000000 / scale);
  syncEditors();
});
$('#edit-fees').addEventListener('click', () => {
  openTab('plan');
  $('#fee-details').open = true;
  $('#fee-details').scrollIntoView({ block: 'start' });
  $('#fee-processing-percent').focus({ preventScroll: true });
});
$('#annual-timing').addEventListener('change', (event) => {
  if (event.target.value === 'custom') {
    showExtras();
    $('#annual-start').focus();
    return;
  }
  changeStructure(() => {
    const scenario = selectedScenario();
    scenario.annualFirstMonth = Number(event.target.value);
    scenario.annualLastMonth = Math.max(scenario.annualLastMonth, scenario.annualFirstMonth);
  });
});
$('#fix-input').addEventListener('click', () => {
  if (!invalidField) return;
  const target = invalidField;
  for (let parent = target.parentElement; parent; parent = parent.parentElement) {
    if (parent.tagName === 'DETAILS') parent.open = true;
  }
  const panel = target.closest('.tab-panel');
  if (panel) openTab(panel.id.replace('panel-', ''));
  target.focus();
  target.scrollIntoView({ block: 'center' });
});
$('#chart-all').addEventListener('change', renderBalanceChart);
$('#jump-to-inputs').addEventListener('click', () => {
  $('#loan-terms-heading').scrollIntoView({ block: 'start' });
  $('#principal').focus({ preventScroll: true });
});
$('#jump-to-results').addEventListener('click', () => {
  showResult();
});
$('#add-scenario').addEventListener('click', () => changeStructure(() => {
  if (plan.scenarios.length >= 12) return;
  const base = defaultScenario({ id: crypto.randomUUID(), name: `Plan ${plan.scenarios.length + 1}` });
  plan.scenarios.push(base);
  plan.selectedId = base.id;
}));
$('#clone-scenario').addEventListener('click', () => changeStructure(() => {
  if (plan.scenarios.length >= 12) return;
  const copy = clone(selectedScenario());
  copy.id = crypto.randomUUID();
  copy.name = `${copy.name.slice(0, 93)} (copy)`;
  plan.scenarios.push(copy);
  plan.selectedId = copy.id;
}));
$('#delete-scenario').addEventListener('click', () => {
  if (!plan || plan.scenarios.length <= 1) return;
  const id = plan.selectedId;
  confirmAction(`Delete “${selectedScenario().name}” from the saved comparison? Other scenarios are unchanged.`, 'Delete scenario', () => {
    plan.scenarios = plan.scenarios.filter((scenario) => scenario.id !== id);
    plan.selectedId = plan.scenarios[0].id;
    page = 0;
    markChanged({ structure: true });
    announce('Scenario deleted.');
  });
});
$('#apply-common').addEventListener('click', () => {
  if (!validDraft()) return;
  const { principal, annualRate } = selectedScenario();
  confirmAction(`Apply ${money(principal)} and ${decimal.format(annualRate)}% starting rate to all ${plan.scenarios.length} scenarios? Their extras, future rate changes and fees stay unchanged.`, 'Apply to all scenarios', () => changeStructure(() => {
    for (const scenario of plan.scenarios) Object.assign(scenario, { principal, annualRate });
  }));
});
$('#add-one-off').addEventListener('click', () => changeStructure(() => {
  if (selectedScenario().oneOffs.length >= 100) return;
  selectedScenario().oneOffs.push({ month: 12, amount: 500000 });
}));
$('#add-rate-change').addEventListener('click', () => changeStructure(() => {
  const scenario = selectedScenario();
  if (scenario.rateChanges.length >= 100) return;
  let month = 12;
  while (scenario.rateChanges.some((change) => change.month === month)) month += 1;
  scenario.rateChanges.push({ month, annualRate: scenario.annualRate });
}));
$('#page-prev').addEventListener('click', () => { page -= 1; renderSchedule(); });
$('#page-next').addEventListener('click', () => { page += 1; renderSchedule(); });
$('#export-plan').addEventListener('click', exportPlan);
$('#export-csv').addEventListener('click', exportCsv);
$('#reload-plan').addEventListener('click', requestReload);
$('#recover-disk').addEventListener('click', requestReload);
$('#retry-save').addEventListener('click', () => {
  if (blocked === 'conflict' || !validDraft()) return;
  clearStorageError();
  if (editVersion === persistedVersion) {
    setSavedStatus();
  } else {
    void saveDraft();
  }
});
$('#remember-device').addEventListener('change', async (event) => {
  const enabled = event.target.checked;
  if (isCanvas || !validDraft()) {
    syncStorageUI();
    return;
  }
  cancelPendingWork();
  setBusy(true);
  setStatus(enabled ? 'Remembering on this device…' : 'Removing saved copy…', 'saving');
  if (savePromise) await savePromise;
  try {
    if (blocked === 'conflict') {
      syncStorageUI();
      setStatus('Saved-plan conflict', 'error');
      return;
    }
    const data = await browserStore.setRemember(enabled, revision, plan);
    adoptRecord(data);
    announce(enabled ? 'Scenarios will be remembered only on this device.' : 'Remembered scenarios removed from this device. Your working scenarios remain in this tab.');
  } catch (error) {
    showStorageError(error, error.status === 409);
  } finally {
    setBusy(false);
  }
});
$('#clear-device-data').addEventListener('click', () => {
  if (isCanvas || replacing) return;
  confirmAction('Clear all scenarios for this calculator from this browser and start fresh? Other website data is not affected. Download your scenarios first if you need them.', 'Clear calculator data', async () => {
    cancelPendingWork();
    setBusy(true);
    setStatus('Clearing calculator data…', 'saving');
    if (savePromise) await savePromise;
    try {
      adoptRecord(await browserStore.clear());
      document.dispatchEvent(new Event('home-loan-clear-theme'));
      openTab('plan');
      announce('Calculator data cleared. The new example is temporary and is not remembered.');
    } catch (error) {
      showStorageError(error, error.status === 409);
    } finally {
      setBusy(false);
      openTab('plan');
    }
  });
});
$('#reset-scenario').addEventListener('click', () => {
  if (!plan || replacing) return;
  confirmAction('Reset this scenario to the generic example? Its loan terms, extras and fees will be replaced. Other scenarios and budget settings stay unchanged.', 'Reset this scenario', () => {
    const selected = selectedScenario();
    Object.assign(selected, defaultScenario({ id: selected.id, name: selected.name }));
    markChanged({ structure: true });
    openTab('plan');
  });
});
$('#import-plan').addEventListener('click', () => { if (!replacing) $('#import-file').click(); });
$('#import-file').addEventListener('change', (event) => {
  const [file] = event.target.files;
  event.target.value = '';
  void importPlan(file);
});
$('#confirm-yes').addEventListener('click', () => {
  const action = pendingConfirmation;
  pendingConfirmation = null;
  $('#action-confirm').hidden = true;
  if (action) void action();
});
$('#confirm-no').addEventListener('click', () => {
  pendingConfirmation = null;
  $('#action-confirm').hidden = true;
  $('#scenario-select').focus();
});
$('#print-plan').addEventListener('click', () => {
  if (preparePrint()) window.print();
});
window.addEventListener('beforeprint', () => {
  if (plan) preparePrint();
  printDetailsState = $$('.assumptions, .fee-breakdown-details, .result-detail, .saved-comparisons').map((details) => [details, details.open]);
  printDetailsState.forEach(([details]) => { details.open = true; });
});
window.addEventListener('afterprint', () => {
  printDetailsState.forEach(([details, open]) => { details.open = open; });
  printDetailsState = [];
});
$('.tabs').addEventListener('keydown', (event) => {
  const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
  if (!keys.includes(event.key)) return;
  event.preventDefault();
  const names = ['plan', 'compare', 'goals', 'schedule'];
  const index = names.indexOf(currentTab);
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? names.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + names.length) % names.length;
  openTab(names[next], true);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    $('.data-menu').open = false;
    if (pendingConfirmation) $('#confirm-no').click();
  }
});
document.addEventListener('click', (event) => {
  const menu = $('.data-menu');
  if (!menu.contains(event.target)) menu.open = false;
});
window.addEventListener('beforeunload', (event) => {
  if (plan && editVersion !== persistedVersion) {
    event.preventDefault();
    event.returnValue = '';
  }
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') void saveDraft();
});

syncStorageUI();
void loadPlan({ initial: true });
