import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Link } from 'gatsby';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Layout } from '@components';
import { usePrefersReducedMotion } from '@hooks';

// ─── Constants ──────────────────────────────────────────────────────────────
const FONT = '18px Calibre, "Avenir Next", "Helvetica Neue", sans-serif';
const LINE_HEIGHT = 28;
const VOID_RADIUS = 100;
const VOID_PADDING = 20;
const LERP_SPEED = 0.08;

const SAMPLE_TEXT = [
  'Readable text depends on more than the words. The width of a column, the space between lines, and the shape of a typeface all influence how a paragraph feels.',
  'A layout that looks comfortable on a wide screen may need a different arrangement on a phone. A heading can wrap, a column can narrow, and a familiar paragraph can take on a different rhythm.',
  'This experiment gives each line its own available width. As the circular opening moves, some lines become shorter while others return to the full column. The text stays the same; only the space around it changes.',
  'Move the opening towards an edge to leave room on the opposite side. Bring it into the middle to divide the column. Notice where a long word moves to the next line and where a short phrase can still fit.',
  'The drawing is made on canvas, while the surrounding headings and controls remain ordinary page elements. The displayed timings describe one part of the calculation, not the performance of the entire page.',
  'Small experiments like this make layout decisions visible. Instead of treating a line break as an invisible browser decision, they turn it into something that can be inspected, adjusted, and compared.',
  'There is no single arrangement that suits every paragraph or every screen. The useful question is whether the result remains clear as the space changes, and whether the reader can follow the words without fighting the layout.',
].join(' ');

// ─── Styled Components ──────────────────────────────────────────────────────
const StyledMainContainer = styled.main`
  padding: 200px 50px 100px;
  max-width: 1200px;
  margin: 0 auto;

  @media (max-width: 768px) {
    padding: 150px 20px 80px;
  }
`;

const StyledBackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  color: var(--green);
  font-family: var(--font-mono);
  font-size: var(--fz-sm);
  margin-bottom: 40px;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }

  &::before {
    content: '←';
    margin-right: 8px;
  }
`;

const StyledHeader = styled.div`
  margin-bottom: 40px;

  h1 {
    color: var(--lightest-slate);
    font-size: clamp(36px, 6vw, 56px);
    margin-bottom: 10px;
  }

  .subtitle {
    color: var(--green);
    font-family: var(--font-mono);
    font-size: var(--fz-md);
    margin-bottom: 8px;
  }

  .description {
    color: var(--slate);
    font-size: var(--fz-lg);
    max-width: 700px;
    line-height: 1.6;
  }
`;

const StyledCanvasSection = styled.section`
  margin-bottom: 80px;

  h2 {
    color: var(--lightest-slate);
    font-size: var(--fz-heading);
    margin-bottom: 8px;
  }

  .section-hint {
    color: var(--slate);
    font-family: var(--font-mono);
    font-size: var(--fz-xs);
    margin-bottom: 20px;
  }
`;

const StyledCanvasWrapper = styled.div`
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius);
  overflow: hidden;
  background: #0f1b2d;
  box-shadow: var(--shadow-lg);
  cursor: none;

  &:focus-within {
    outline: 2px solid var(--accent);
    outline-offset: 4px;
  }

  canvas {
    display: block;
    width: 100%;
  }
`;

const StyledStatsBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px 24px;
  padding: 12px 16px;
  background: #0b1726;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  font-family: var(--font-mono);
  font-size: var(--fz-xxs);
  color: rgba(226, 232, 240, 0.7);

  .stat-value {
    color: #5eead4;
  }
`;

const StyledDemoSection = styled.section`
  margin-bottom: 80px;

  h2 {
    color: var(--lightest-slate);
    font-size: var(--fz-heading);
    margin-bottom: 8px;
  }

  .section-hint {
    color: var(--slate);
    font-family: var(--font-mono);
    font-size: var(--fz-xs);
    margin-bottom: 20px;
  }
`;

const StyledShrinkWrapDemo = styled.div`
  display: flex;
  gap: 40px;
  align-items: flex-start;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const StyledTextBlock = styled.div`
  flex: 1;
  min-width: 0;
  width: 100%;
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface);
  box-shadow: var(--shadow-md);

  h3 {
    font-family: var(--font-mono);
    font-size: var(--fz-xs);
    color: var(--green);
    margin-bottom: 12px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .text-content {
    color: var(--light-slate);
    font-size: 16px;
    line-height: 1.6;
  }

  .stat {
    font-family: var(--font-mono);
    font-size: var(--fz-xxs);
    color: var(--slate);
    margin-top: 12px;
  }

  .stat-value {
    color: var(--green);
  }
`;

const StyledFlowDemo = styled.div`
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius);
  overflow: hidden;
  background: #0f1b2d;
  box-shadow: var(--shadow-lg);

  canvas {
    display: block;
    width: 100%;
  }
`;

const StyledSliderRow = styled.div`
  display: flex;
  gap: 30px;
  padding: 16px;
  background: #0b1726;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  flex-wrap: wrap;

  label {
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: var(--font-mono);
    font-size: var(--fz-xxs);
    color: rgba(226, 232, 240, 0.7);
  }

  input[type='range'] {
    -webkit-appearance: none;
    width: 120px;
    height: 4px;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 2px;
    outline: none;

    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 14px;
      height: 14px;
      background: #5eead4;
      border-radius: 50%;
      cursor: pointer;
    }
  }

  .val {
    color: #5eead4;
    min-width: 30px;
  }
`;

const StyledAboutSection = styled.section`
  max-width: 700px;
  margin-bottom: 60px;

  h2 {
    color: var(--lightest-slate);
    font-size: var(--fz-heading);
    margin-bottom: 16px;
  }

  p {
    color: var(--slate);
    line-height: 1.7;
    font-size: var(--fz-lg);
    margin-bottom: 12px;
  }

  code {
    color: var(--accent-strong);
    font-family: var(--font-mono);
    font-size: var(--fz-sm);
    background: var(--accent-tint);
    border: 1px solid var(--accent-tint-strong);
    padding: 2px 6px;
    border-radius: var(--radius-sm);
  }
`;

// ─── Liquid Typography Canvas (Void follows cursor) ─────────────────────────
const LiquidCanvas = () => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const reduceMotionRef = useRef(prefersReducedMotion);
  const canvasRef = useRef(null);
  const preparedRef = useRef(null);
  const animRef = useRef(null);
  const mouseRef = useRef({ x: -999, y: -999 });
  const smoothMouseRef = useRef({ x: -999, y: -999 });
  const canvasSizeRef = useRef({ w: 0, h: 0 });
  const [stats, setStats] = useState({ layoutTime: 0, lines: 0, fps: 0 });
  const [loadError, setLoadError] = useState(false);
  const fpsRef = useRef({ frames: 0, lastTime: performance.now() });

  useEffect(() => {
    reduceMotionRef.current = prefersReducedMotion;
  }, [prefersReducedMotion]);

  const moveOpening = event => {
    const rect = event.currentTarget.getBoundingClientRect();
    const position = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    mouseRef.current = position;
    if (event.pointerType === 'touch') {
      smoothMouseRef.current = { ...position };
    }
  };

  const moveOpeningWithKeyboard = event => {
    const directions = {
      ArrowLeft: [-24, 0],
      ArrowRight: [24, 0],
      ArrowUp: [0, -24],
      ArrowDown: [0, 24],
    };
    if (!directions[event.key] && event.key !== 'Escape') {
      return;
    }
    event.preventDefault();
    if (event.key === 'Escape') {
      mouseRef.current = { x: -999, y: -999 };
      return;
    }
    const { w, h } = canvasSizeRef.current;
    const current = mouseRef.current.x < 0 ? { x: w / 2, y: h / 2 } : mouseRef.current;
    const [dx, dy] = directions[event.key];
    mouseRef.current = {
      x: Math.max(0, Math.min(w, current.x + dx)),
      y: Math.max(0, Math.min(h, current.y + dy)),
    };
  };

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const prepared = preparedRef.current;
    if (!canvas || !prepared) {
      return;
    }

    const ctx = canvas.getContext('2d');
    const { w, h } = canvasSizeRef.current;
    const dpr = window.devicePixelRatio || 1;

    // Lerp smooth mouse position
    const sm = smoothMouseRef.current;
    const m = mouseRef.current;
    const speed = reduceMotionRef.current ? 1 : LERP_SPEED;
    sm.x += (m.x - sm.x) * speed;
    sm.y += (m.y - sm.y) * speed;

    // Clear
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const padding = 30;
    const totalRadius = VOID_RADIUS + VOID_PADDING;

    // Draw the void circle (subtle)
    const voidX = sm.x;
    const voidY = sm.y;

    // Glow effect
    const gradient = ctx.createRadialGradient(voidX, voidY, 0, voidX, voidY, totalRadius);
    gradient.addColorStop(0, 'rgba(100, 255, 218, 0.06)');
    gradient.addColorStop(0.7, 'rgba(100, 255, 218, 0.02)');
    gradient.addColorStop(1, 'rgba(100, 255, 218, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(voidX, voidY, totalRadius, 0, Math.PI * 2);
    ctx.fill();

    // Void border ring
    ctx.strokeStyle = 'rgba(100, 255, 218, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(voidX, voidY, VOID_RADIUS, 0, Math.PI * 2);
    ctx.stroke();

    // Layout text line by line using layoutNextLine with variable widths
    const { layoutNextLine } = preparedRef.current._module;
    const maxW = w - padding * 2;

    const t0 = performance.now();

    let cursor = { segmentIndex: 0, graphemeIndex: 0 };
    let y = padding;
    let lineCount = 0;
    const lines = [];

    while (y < h - padding) {
      // Calculate how much width the void eats on this line
      const lineTop = y;
      const lineBottom = y + LINE_HEIGHT;
      const lineCenterY = (lineTop + lineBottom) / 2;

      let availableWidth = maxW;
      let xOffset = padding;

      // Check if this line intersects the void circle
      const dy = lineCenterY - voidY;
      if (Math.abs(dy) < totalRadius) {
        const chordHalf = Math.sqrt(totalRadius * totalRadius - dy * dy);
        const voidLeft = voidX - chordHalf;
        const voidRight = voidX + chordHalf;

        // Void is near the left edge — push text right
        if (voidLeft < padding + maxW * 0.3) {
          const cutRight = Math.max(0, voidRight - padding);
          xOffset = padding + cutRight;
          availableWidth = maxW - cutRight;
        } else if (voidRight > padding + maxW * 0.7) {
          // Void is near the right edge — shrink line width
          const cutLeft = Math.max(0, padding + maxW - voidLeft);
          availableWidth = maxW - cutLeft;
        } else {
          // Void is in the middle — use the larger side
          const leftSpace = voidLeft - padding;
          const rightSpace = padding + maxW - voidRight;
          if (leftSpace >= rightSpace) {
            availableWidth = leftSpace;
          } else {
            xOffset = voidRight;
            availableWidth = rightSpace;
          }
        }
      }

      availableWidth = Math.max(availableWidth, 40);

      const line = layoutNextLine(prepared.data, cursor, Math.max(availableWidth, 40));
      if (!line) {
        break;
      }

      lines.push({ text: line.text, x: xOffset, y, width: line.width });
      cursor = line.end;
      y += LINE_HEIGHT;
      lineCount++;
    }

    const layoutTime = performance.now() - t0;

    // Draw text
    ctx.font = FONT;
    ctx.textBaseline = 'top';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Distance-based opacity for lines near the void
      const lineCY = line.y + LINE_HEIGHT / 2;
      const dist = Math.sqrt((line.x + line.width / 2 - voidX) ** 2 + (lineCY - voidY) ** 2);
      const proximity = Math.max(
        0,
        1 - Math.max(0, totalRadius * 1.5 - dist) / (totalRadius * 1.5),
      );
      const alpha = 0.75 + proximity * 0.15;

      ctx.fillStyle = `rgba(168, 178, 209, ${alpha})`;
      ctx.fillText(line.text, line.x, line.y + 4);
    }

    // FPS tracking
    fpsRef.current.frames++;
    const now = performance.now();
    if (now - fpsRef.current.lastTime > 500) {
      const fps = Math.round(fpsRef.current.frames / ((now - fpsRef.current.lastTime) / 1000));
      fpsRef.current = { frames: 0, lastTime: now };
      setStats({ layoutTime: layoutTime.toFixed(3), lines: lineCount, fps });
    }

    animRef.current = requestAnimationFrame(drawFrame);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let removeListeners;

    const init = async () => {
      const { prepareWithSegments, layoutNextLine } = await import('@chenglou/pretext');
      await document.fonts.load(FONT);
      if (cancelled) {
        return;
      }

      const prepared = prepareWithSegments(SAMPLE_TEXT, FONT);
      preparedRef.current = { data: prepared, _module: { layoutNextLine } };

      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }
      if (!canvas.getContext('2d')) {
        throw new Error('Canvas rendering is unavailable');
      }

      const resize = () => {
        const rect = canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const w = rect.width;
        const h = 500;
        canvasSizeRef.current = { w, h };
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.height = `${h}px`;
      };

      resize();
      window.addEventListener('resize', resize);

      animRef.current = requestAnimationFrame(drawFrame);

      removeListeners = () => {
        window.removeEventListener('resize', resize);
      };
    };

    init().catch(error => {
      if (!cancelled) {
        console.error('Unable to initialize the text-wrapping demo:', error);
        setLoadError(true);
      }
    });

    return () => {
      cancelled = true;
      removeListeners?.();
      if (animRef.current !== null) {
        cancelAnimationFrame(animRef.current);
      }
    };
  }, [drawFrame]);

  if (loadError) {
    return <p role="alert">This demo could not load. Reload the page to try again.</p>;
  }

  return (
    <>
      <StyledCanvasWrapper>
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="Interactive text wrapping around a movable circular opening"
          aria-describedby="void-instructions"
          tabIndex={0}
          onPointerMove={moveOpening}
          onPointerDown={moveOpening}
          onPointerLeave={event => {
            if (event.pointerType !== 'touch') {
              mouseRef.current = { x: -999, y: -999 };
            }
          }}
          onKeyDown={moveOpeningWithKeyboard}>
          {SAMPLE_TEXT}
        </canvas>
      </StyledCanvasWrapper>
      <StyledStatsBar>
        <span>
          Layout calculation: <span className="stat-value">{stats.layoutTime}ms</span>
        </span>
        <span>
          Lines: <span className="stat-value">{stats.lines}</span>
        </span>
        <span>
          Observed frames/s: <span className="stat-value">{stats.fps}</span>
        </span>
        <span>
          Rendering: <span className="stat-value">Canvas</span>
        </span>
      </StyledStatsBar>
    </>
  );
};

// ─── Shape Flow Canvas (Text wraps around a draggable diamond + circle) ─────
const ShapeFlowCanvas = () => {
  const canvasRef = useRef(null);
  const preparedRef = useRef(null);
  const animRef = useRef(null);
  const canvasSizeRef = useRef({ w: 0, h: 0 });
  const [shapeRadius, setShapeRadius] = useState(80);
  const [shapeY, setShapeY] = useState(140);
  const [loadError, setLoadError] = useState(false);
  const shapeParamsRef = useRef({ radius: 80, y: 140 });

  const FLOW_TEXT = [
    'An illustration changes the space available to a paragraph. A small circle leaves most lines untouched; a larger one asks the text to find another route.',
    'Use the controls to change the radius and vertical position. Each line is laid out against the space that remains beside the circle, so the boundary changes gradually rather than forming a rectangular gap.',
    'Moving the circle towards the top affects the opening lines. Moving it down leaves the beginning of the paragraph in place and changes the lines that follow.',
    'The words do not need to change for the composition to feel different. A small adjustment to the available width can move an entire word, which changes the line below it as well.',
    'Today, text moves between screens of different sizes, but the layout question remains: how do we arrange it so people can read it easily?',
  ].join(' ');

  useEffect(() => {
    shapeParamsRef.current = { radius: shapeRadius, y: shapeY };
  }, [shapeRadius, shapeY]);

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const prepared = preparedRef.current;
    if (!canvas || !prepared) {
      return;
    }

    const ctx = canvas.getContext('2d');
    const { w, h } = canvasSizeRef.current;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const padding = 24;
    const maxW = w - padding * 2;
    const { radius, y: shapeCenter } = shapeParamsRef.current;
    const shapeCenterX = w - padding - radius - 10;

    // Draw shape (rounded rect / circle)
    ctx.fillStyle = 'rgba(100, 255, 218, 0.08)';
    ctx.strokeStyle = 'rgba(100, 255, 218, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(shapeCenterX, shapeCenter, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Label inside shape
    ctx.fillStyle = 'rgba(100, 255, 218, 0.85)';
    ctx.font = '13px SF Mono, Fira Code, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`r=${radius}px`, shapeCenterX, shapeCenter - 8);
    ctx.fillText('use sliders', shapeCenterX, shapeCenter + 8);
    ctx.textAlign = 'left';

    // Layout with variable widths
    const { layoutNextLine } = prepared._module;
    let cursor = { segmentIndex: 0, graphemeIndex: 0 };
    let yPos = padding;
    const lines = [];

    while (yPos < h - padding) {
      const lineCY = yPos + LINE_HEIGHT / 2;
      let lineMaxW = maxW;

      // Check intersection with the shape
      const dy = lineCY - shapeCenter;
      if (Math.abs(dy) < radius + 8) {
        const chordHalf = Math.sqrt(Math.max(0, (radius + 8) ** 2 - dy * dy));
        const shapeLeft = shapeCenterX - chordHalf;
        lineMaxW = Math.max(40, shapeLeft - padding);
      }

      const line = layoutNextLine(prepared.data, cursor, lineMaxW);
      if (!line) {
        break;
      }
      lines.push({ text: line.text, x: padding, y: yPos, width: line.width });
      cursor = line.end;
      yPos += LINE_HEIGHT;
    }

    // Draw text
    ctx.font = FONT;
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(168, 178, 209, 0.85)';
    for (const line of lines) {
      ctx.fillText(line.text, line.x, line.y + 4);
    }

    animRef.current = requestAnimationFrame(drawFrame);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let removeListeners;

    const init = async () => {
      const { prepareWithSegments, layoutNextLine } = await import('@chenglou/pretext');
      await document.fonts.load(FONT);
      if (cancelled) {
        return;
      }

      const FLOW_FONT = FONT;
      const prepared = prepareWithSegments(FLOW_TEXT, FLOW_FONT);
      preparedRef.current = { data: prepared, _module: { layoutNextLine } };

      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }
      if (!canvas.getContext('2d')) {
        throw new Error('Canvas rendering is unavailable');
      }

      const resize = () => {
        const rect = canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const w = rect.width;
        const h = 400;
        canvasSizeRef.current = { w, h };
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.height = `${h}px`;
      };

      resize();
      window.addEventListener('resize', resize);
      animRef.current = requestAnimationFrame(drawFrame);

      removeListeners = () => {
        window.removeEventListener('resize', resize);
      };
    };

    init().catch(error => {
      if (!cancelled) {
        console.error('Unable to initialize the shape-flow demo:', error);
        setLoadError(true);
      }
    });

    return () => {
      cancelled = true;
      removeListeners?.();
      if (animRef.current !== null) {
        cancelAnimationFrame(animRef.current);
      }
    };
  }, [drawFrame]);

  if (loadError) {
    return <p role="alert">This demo could not load. Reload the page to try again.</p>;
  }

  return (
    <>
      <StyledFlowDemo>
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`Sample text wrapping around a circle with radius ${shapeRadius} pixels, positioned ${shapeY} pixels from the top`}>
          {FLOW_TEXT}
        </canvas>
      </StyledFlowDemo>
      <StyledSliderRow>
        <label>
          Circle radius (px)
          <input
            type="range"
            aria-label="Circle radius in pixels"
            min="30"
            max="150"
            value={shapeRadius}
            onChange={e => setShapeRadius(Number(e.target.value))}
          />
          <span className="val">{shapeRadius}</span>
        </label>
        <label>
          Vertical position (px)
          <input
            type="range"
            aria-label="Vertical position in pixels"
            min="40"
            max="360"
            value={shapeY}
            onChange={e => setShapeY(Number(e.target.value))}
          />
          <span className="val">{shapeY}</span>
        </label>
      </StyledSliderRow>
    </>
  );
};

// ─── Shrink-Wrap / Balanced Text (walkLineRanges binary search) ─────────────
const BalancedTextDemo = () => {
  const [result, setResult] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const BALANCE_TEXT =
    'Software engineer working with React and React Native on mobile applications and developer tools.';

  useEffect(() => {
    let cancelled = false;

    const compute = async () => {
      const { prepareWithSegments, walkLineRanges, layoutWithLines } = await import(
        '@chenglou/pretext'
      );
      await document.fonts.load(FONT);
      if (cancelled) {
        return;
      }

      const prepared = prepareWithSegments(BALANCE_TEXT, FONT);

      // Naive layout at 500px
      const naiveResult = layoutWithLines(prepared, 500, 26);

      // Binary search for balanced width
      let lo = 100;
      let hi = 500;
      let bestWidth = 500;
      const targetLines = naiveResult.lineCount;

      while (hi - lo > 1) {
        const mid = (lo + hi) / 2;
        let count = 0;
        walkLineRanges(prepared, mid, () => {
          count++;
        });
        if (count <= targetLines) {
          bestWidth = mid;
          hi = mid;
        } else {
          lo = mid;
        }
      }

      const balancedResult = layoutWithLines(prepared, bestWidth, 26);

      // Get max line width for each
      let naiveMax = 0;
      for (const l of naiveResult.lines) {
        if (l.width > naiveMax) {
          naiveMax = l.width;
        }
      }
      let balancedMax = 0;
      for (const l of balancedResult.lines) {
        if (l.width > balancedMax) {
          balancedMax = l.width;
        }
      }

      // Compute raggedness (variance in line widths)
      const naiveWidths = naiveResult.lines.map(l => l.width);
      const balancedWidths = balancedResult.lines.map(l => l.width);
      const variance = arr => {
        const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
        return Math.round(arr.reduce((sum, v) => sum + (v - mean) ** 2, 0) / arr.length);
      };

      setResult({
        naive: {
          lines: naiveResult.lines,
          width: 500,
          maxLineWidth: Math.round(naiveMax),
          raggedness: variance(naiveWidths),
        },
        balanced: {
          lines: balancedResult.lines,
          width: Math.round(bestWidth),
          maxLineWidth: Math.round(balancedMax),
          raggedness: variance(balancedWidths),
        },
      });
    };

    compute().catch(error => {
      if (!cancelled) {
        console.error('Unable to compute the balanced-text demo:', error);
        setLoadError(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loadError) {
    return <p role="alert">This demo could not load. Reload the page to try again.</p>;
  }

  if (!result) {
    return <p style={{ color: 'var(--slate)' }}>Computing balanced layout...</p>;
  }

  return (
    <StyledShrinkWrapDemo>
      <StyledTextBlock>
        <h3>Fixed width (500px)</h3>
        <div className="text-content">
          {result.naive.lines.map((line, i) => (
            <div key={i}>{line.text}</div>
          ))}
        </div>
        <div className="stat">
          Line-width variance (px²): <span className="stat-value">{result.naive.raggedness}</span> ·
          Widest line: <span className="stat-value">{result.naive.maxLineWidth}px</span>
        </div>
      </StyledTextBlock>
      <StyledTextBlock>
        <h3>Fitted width ({result.balanced.width}px)</h3>
        <div className="text-content">
          {result.balanced.lines.map((line, i) => (
            <div key={i}>{line.text}</div>
          ))}
        </div>
        <div className="stat">
          Line-width variance (px²):{' '}
          <span className="stat-value">{result.balanced.raggedness}</span> · Widest line:{' '}
          <span className="stat-value">{result.balanced.maxLineWidth}px</span>
        </div>
      </StyledTextBlock>
    </StyledShrinkWrapDemo>
  );
};

// ─── Main Page ──────────────────────────────────────────────────────────────
const LiquidTypographyPage = ({ location }) => (
  <Layout
    location={location}
    title="Liquid Typography"
    description="An interactive typography experiment exploring canvas text wrapping, movable shapes, and fitted line widths.">
    <StyledMainContainer aria-labelledby="liquid-typography-title">
      <StyledBackLink to="/playground">Playground</StyledBackLink>

      <StyledHeader>
        <p className="subtitle">Powered by @chenglou/pretext</p>
        <h1 id="liquid-typography-title">Liquid Typography</h1>
        <p className="description">
          Explore how text wraps as the available space changes. Move the circular opening with your
          pointer, touch, or keyboard.
        </p>
      </StyledHeader>

      <StyledCanvasSection>
        <h2>The Void</h2>
        <p className="section-hint" id="void-instructions">
          Move your pointer, tap the text, or focus the canvas and use the arrow keys. Press Escape
          to reset the opening.
        </p>
        <LiquidCanvas />
      </StyledCanvasSection>

      <StyledDemoSection>
        <h2>Shape Flow</h2>
        <p className="section-hint">
          Text wraps around a positioned shape — adjust radius and position with the sliders
        </p>
        <ShapeFlowCanvas />
      </StyledDemoSection>

      <StyledDemoSection>
        <h2>Balanced Text</h2>
        <p className="section-hint">
          A binary search finds a narrower text width without adding lines. Compare the resulting
          line widths below.
        </p>
        <BalancedTextDemo />
      </StyledDemoSection>

      <StyledAboutSection>
        <h2>How It Works</h2>
        <p>
          The demo prepares text with <code>@chenglou/pretext</code> when it loads. On each
          animation frame, it calculates the available width beside the circular opening, lays out
          each line, and draws the text on canvas.
        </p>
        <p>
          The statistics report the line-layout calculation and observed frame rate. Layout timing
          excludes drawing; results vary by browser and device. Width comparisons use a 500px
          reference layout; their text previews wrap to fit smaller screens.
        </p>
      </StyledAboutSection>
    </StyledMainContainer>
  </Layout>
);

LiquidTypographyPage.propTypes = {
  location: PropTypes.object.isRequired,
};

export default LiquidTypographyPage;
