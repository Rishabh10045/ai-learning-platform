import { lessonDiagrams } from './lesson-diagrams.js';
import { lessonDetails } from './lesson-details.js';

export function element(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === false) continue;
    if (name === 'text') node.textContent = value;
    else if (value === true) node.setAttribute(name, '');
    else node.setAttribute(name, value);
  }
  for (const child of children.flat()) {
    if (child !== null && child !== undefined) node.append(child);
  }
  return node;
}

export function diagramForDay(number, positions) {
  const diagram = lessonDiagrams[number];
  if (!diagram) return null;

  const selection = positions.get(number) || { scenario: 0, step: 0 };
  positions.set(number, selection);
  const headingId = 'diagram-title-' + number;
  const detailId = 'diagram-detail-' + number;
  const timeline = element('ol', { class: 'lesson-flow', 'aria-label': 'Diagram steps' });
  const detail = element('div', { id: detailId, class: 'lesson-step-detail', 'aria-live': 'polite' });
  const previous = element('button', { type: 'button', class: 'sd-btn' }, 'Previous step');
  const next = element('button', { type: 'button', class: 'sd-btn sd-btn-primary' }, 'Next step');
  const figure = element('section', { class: 'sd-card lesson-diagram', 'aria-labelledby': headingId },
    element('h3', { id: headingId }, diagram.title),
    element('p', { class: 'sd-muted' }, diagram.question)
  );

  if (diagram.scenarios.length > 1) {
    const input = element('select', { id: 'diagram-scenario-' + number });
    for (const [index, scenario] of diagram.scenarios.entries()) {
      input.append(element('option', { value: index }, scenario.label));
    }
    input.value = String(selection.scenario);
    input.addEventListener('change', () => {
      selection.scenario = Number(input.value);
      selection.step = 0;
      renderTimeline();
    });
    figure.append(element('label', { class: 'study-field' }, 'Scenario', input));
  }

  const controls = element('div', { class: 'study-row lesson-step-actions' }, previous, next);
  figure.append(timeline, detail, controls);

  function updateStep(index) {
    const scenario = diagram.scenarios[selection.scenario];
    selection.step = Math.max(0, Math.min(index, scenario.steps.length - 1));
    const step = scenario.steps[selection.step];
    for (const [stepIndex, button] of Array.from(timeline.querySelectorAll('button')).entries()) {
      button.setAttribute('aria-pressed', String(stepIndex === selection.step));
    }
    detail.replaceChildren(
      element('span', { class: 'lesson-step-count' }, 'Step ' + (selection.step + 1) + ' of ' + scenario.steps.length),
      element('h4', {}, step.label), element('p', {}, step.explanation),
      element('ul', { class: 'lesson-state' }, step.facts.map(fact => element('li', {}, fact)))
    );
    previous.disabled = selection.step === 0;
    next.disabled = selection.step === scenario.steps.length - 1;
  }

  function renderTimeline() {
    const scenario = diagram.scenarios[selection.scenario];
    timeline.replaceChildren(...scenario.steps.map((step, index) => {
      const button = element('button', { class: 'lesson-step', type: 'button', 'aria-controls': detailId },
        element('span', { class: 'lesson-step-num', 'aria-hidden': 'true' }, String(index + 1)),
        element('span', {}, step.label)
      );
      button.addEventListener('click', () => updateStep(index));
      return element('li', {}, button);
    }));
    updateStep(selection.step);
  }

  previous.addEventListener('click', () => updateStep(selection.step - 1));
  next.addEventListener('click', () => updateStep(selection.step + 1));
  renderTimeline();
  return figure;
}

export function comparisonForDay(number) {
  const table = lessonDetails[number]?.table;
  if (!table) return null;
  const id = 'comparison-title-' + number;
  const heading = element('h3', { id }, table.title);
  const header = element('thead', {}, element('tr', {}, table.headers.map(name => element('th', { scope: 'col' }, name))));
  const body = element('tbody', {}, table.rows.map(row => element('tr', {}, row.map((cell, i) =>
    i === 0 ? element('th', { scope: 'row' }, cell) : element('td', {}, cell)
  ))));
  const scroll = element('div', { class: 'lesson-table-wrap', tabindex: 0, role: 'region', 'aria-labelledby': id },
    element('table', { class: 'lesson-table', 'aria-labelledby': id }, header, body)
  );
  return element('section', { class: 'sd-card lesson-comparison' }, heading, scroll);
}
