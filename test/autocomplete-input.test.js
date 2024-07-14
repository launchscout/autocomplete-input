import { expect } from "@esm-bundle/chai";
import { fixture, oneEvent, nextFrame, aTimeout } from '@open-wc/testing';
import '../src/autocomplete-input';

it('renders an input', async () => {
  const el = await fixture(`
    <autocomplete-input name="foo"></autocomplete-input>
  `);
  expect(el.shadowRoot.querySelector('input')).to.exist;
})

it('emits an autocomplete-search event', async () => {
  const el = await fixture(`
    <autocomplete-input name="foo"></autocomplete-input>
  `);

  const searchInput = el.shadowRoot.querySelector('input');
  searchInput.value = 'foo';
  searchInput.dispatchEvent(new Event('input', { bubbles: true }));
  const { detail } = await oneEvent(el, 'autocomplete-search');
  expect(detail.query).to.equal('foo');
});

describe('the combobox', () => {
  it('builds a combobox and sends autocomplete-commit for a slotted list', async () => {
    const el = await fixture(`
      <autocomplete-input name="foo">
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
          <autocomplete-input name="foo">
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
    expect(autocompleteElement.displayValue).to.equal('Bar');
  });

  it('clears options', async () => {
    const formElement = await fixture(`
        <form>
          <autocomplete-input name="foo">
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
        <autocomplete-input name="foo" value="bar">
          <ul slot="list">
            <li role="option" data-value="bar">Bar</li>
          </ul>
        </autocomplete-input>
      </form>
    `);
    expect(new FormData(formElement).get('foo')).to.eq('bar')
  });

  it('restores on escape', async () => {
    const formElement = await fixture(`
      <form>
        <autocomplete-input name="foo" value="bar">
          <ul slot="list">
            <li role="option" data-value="bar">Bar</li>
          </ul>
        </autocomplete-input>
      </form>
    `);
  });
});
