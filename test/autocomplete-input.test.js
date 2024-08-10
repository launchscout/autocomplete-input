import { expect, fixture, oneEvent, nextFrame, aTimeout } from '@open-wc/testing';
import '../src/autocomplete-input';
import { assert } from '@esm-bundle/chai';

it('renders the slot when in initial state', async () => {
  const el = await fixture(`
    <autocomplete-input name="foo">bar</autocomplete-input>
  `);
  expect(el.innerHTML).to.equal('bar');
})

it('displays an input when opened', async () => {
  const el = await fixture(`
    <autocomplete-input name="foo" search-value="abc">bar</autocomplete-input>
  `);
  el.click();
  await el.updated;
  const searchInput = el.shadowRoot.querySelector('input');
  expect(searchInput).to.exist;
  expect(el.hasState('open')).to.be.true;
});

// not sure what's up here
xit('clears the previous value from the input when re-opened', async () => {
  const el = await fixture(`
    <autocomplete-input name="foo">bar</autocomplete-input>
  `);
  el.click();
  await el.updated;
  let searchInput = el.shadowRoot.querySelector('input');
  searchInput.value = 'foo';
  searchInput.dispatchEvent(new Event('input', { bubbles: true }));
  await el.updated;
  el.click();
  await el.updated;
  searchInput = el.shadowRoot.querySelector('input');
  expect(searchInput.value).to.equal('');
});

it('emits an autocomplete-search event', async () => {
  const el = await fixture(`
    <autocomplete-input name="foo" open debounce="10"></autocomplete-input>
  `);
  // el.click();
  // await el.updated;
  const searchInput = el.shadowRoot.querySelector('input');
  searchInput.value = 'foo';
  searchInput.dispatchEvent(new Event('input', { bubbles: true }));
  const { detail } = await oneEvent(el, 'autocomplete-search');
  expect(detail.query).to.equal('foo');
});

it('only dispatches search event when the mininum length is met', async () => {
  const el = await fixture(`
    <autocomplete-input name="foo" open min-length="3" debounce="10"></autocomplete-input>
  `);
  el.addEventListener('autocomplete-search', () => { 
    assert.fail();
  });
  const searchInput = el.shadowRoot.querySelector('input');
  searchInput.value = 'f';
  searchInput.dispatchEvent(new Event('input', { bubbles: true }));
  await el.updated;
});

describe('the combobox', () => {
  it('builds a combobox and sends autocomplete-commit for a slotted list', async () => {
    const el = await fixture(`
      <autocomplete-input name="foo" open>
        <ul slot="list">
          <li role="option" data-value="foo">Foo</li>
        </ul>
      </autocomplete-input>
    `);
    const option = el.querySelector('li[data-value="foo"]');
    el.addEventListener('autocomplete-commit', (e) => {
      console.debug(e.detail)
      expect(e.detail.value).to.equal('foo');
    });
    option.click();
  });

  it('sets values when an option is clicked', async () => {
    const formElement = await fixture(`
        <form>
          <autocomplete-input name="foo" open>
            <ul slot="list">
              <li role="option" data-value="bar">Bar</li>
            </ul>
          </autocomplete-input>
        </form>
      `);
    const option = formElement.querySelector('li[data-value="bar"]');
    option.click();
    expect(new FormData(formElement).get('foo')).to.eq('bar');
    const autocompleteElement = formElement.querySelector('autocomplete-input');
    expect(autocompleteElement.value).to.equal('bar');
  });

  it('clears options if requested to', async () => {
    const formElement = await fixture(`
        <form>
          <autocomplete-input name="foo" open clear-list-on-select>
            <ul slot="list">
              <li role="option" data-value="bar">Bar</li>
            </ul>
          </autocomplete-input>
        </form>
      `);
    const option = formElement.querySelector('li[data-value="bar"]');
    option.click();
    const options = formElement.querySelectorAll('ul li');
    expect(options).to.have.length(0);
  });

  it('sets form value from value attribute', async () => {
    const formElement = await fixture(`
      <form>
        <autocomplete-input name="foo" value="bar" open>
          <ul slot="list">
            <li role="option" data-value="bar">Bar</li>
          </ul>
        </autocomplete-input>
      </form>
    `);
    expect(new FormData(formElement).get('foo')).to.eq('bar')
  });

  it('restores on escape', async () => {
    const el = await fixture(`
        <autocomplete-input name="foo" value="bar" display-value="Bar" open>
          <ul slot="list">
            <li role="option" data-value="bar">Bar</li>
          </ul>
        </autocomplete-input>
    `);
    const searchInput = el.shadowRoot.querySelector('input');
    searchInput.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape'}));
    const closeEvent = await oneEvent(el, 'autocomplete-close');
    expect(closeEvent).to.exist;
  });
});
