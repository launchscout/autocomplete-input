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
  el.shadowRoot.querySelector('div.display-wrapper').click();
  await el.updated;
  const searchInput = el.shadowRoot.querySelector('input');
  expect(searchInput).to.exist;
  expect(el.hasState('open')).to.be.true;
});

it('emits an autocomplete-search event', async () => {
  const el = await fixture(`
    <autocomplete-input name="foo" open debounce="10"></autocomplete-input>
  `);
  const searchInput = el.shadowRoot.querySelector('input');
  searchInput.value = 'bar';
  searchInput.dispatchEvent(new Event('input', { bubbles: true }));
  const { detail } = await oneEvent(el, 'autocomplete-search');
  expect(detail.query).to.equal('bar');
  expect(detail.name).to.equal('foo');
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
      <autocomplete-input name="bar" open items='[{"value": "foo", "label": "Foo"}]'>
      </autocomplete-input>
    `);
    const option = el.shadowRoot.querySelector('li[data-value="foo"]');
    el.addEventListener('autocomplete-commit', (e) => {
      console.debug(e.detail)
      expect(e.detail.value).to.equal('foo');
      expect(e.detail.name).to.equal('bar');
    });
    option.click();
  });

  it('sets values when an option is clicked', async () => {
    const formElement = await fixture(`
        <form>
          <autocomplete-input name="foo" open items='[{"value": "bar", "label": "Bar"}]'>
          </autocomplete-input>
        </form>
      `);
    const autocompleteElement = formElement.querySelector('autocomplete-input');
    const option = autocompleteElement.shadowRoot.querySelector('li[data-value="bar"]');
    option.click();
    expect(new FormData(formElement).get('foo')).to.eq('bar');
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

});
