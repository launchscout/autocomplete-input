import Combobox from '@github/combobox-nav';
import debounce from './debounce.js';
import { LitElement, html } from 'lit';
import { live } from 'lit/directives/live.js';

export class AutocompleteInputElement extends LitElement {
  static formAssociated = true;

  static properties = {
    value: {},
    name: {},
    debounce: { type: Number },
    minlength: { type: Number },
    searchValue: { attribute: 'search-value' },
    clearListOnSelect: { attribute: 'clear-list-on-select', type: Boolean },
    state: {},
  }

  constructor() {
    super();
    this.searchValue = '';
    this.debounce = 300;
    this.minlength = 3;
    this.elementInternals = this.attachInternals();
    this.state = 'initial';
    this.addEventListener('click', (e) => {
      if (this.state != 'open') {
        this.searchValue = '';
      }
      this.state = 'open';
    });
  }

  updated() {
    console.debug('updating...');
    if (this.elementInternals) {
      this.elementInternals.states.clear();
      this.elementInternals.states.add(this.state);
    }
    if (this.elementInternals.form && this.value) {
      this.elementInternals.setFormValue(this.value, this.searchValue);
    }
    if (this.state == 'open') {
      this.searchInput.focus();
    }
    this.initializeComboBox();
  }

  render() {
    return html`${this.state == 'open' ? html`
    <input name="${this.name}" .value="${this.searchValue}" part="input" autocomplete="off" @input=${debounce((e) => this.onSearch(e), this.debounce)}>
    ` : html`<slot></slot>`}
    <slot name="list" @combobox-commit=${this.onCommit}></slot>
    `;
  }

  onClick(e) {
    this.searchValue = '';
    this.state = 'open';
  }

  onSearch(e) {
    if (this.searchInput.value.length >= this.minlength) {
      this.state = 'searching';
      this.dispatchEvent(
        new CustomEvent('autocomplete-search', { detail: { query: this.searchInput.value } }));  
    }
  }

  onCommit({ target }) {
    this.state = 'selected';
    this.searchValue = target.dataset.label ? target.dataset.label : target.innerText;
    this.value = target.dataset.value;
    if (this.elementInternals.form) {
      this.elementInternals.setFormValue(target.dataset.value);
      new FormData(this.elementInternals.form).forEach(console.debug);
    }
    if (this.clearListOnSelect) {
      this.list.replaceChildren();
    }
    this.dispatchEvent(new CustomEvent('autocomplete-commit', { detail: target.dataset, bubbles: true }));
  }

  get list() {
    if (this.getAttribute('list')) {
      return document.querySelector(`#${this.getAttribute('list')}`);
    }
    const listSlot = this.shadowRoot.querySelector('slot[name="list"]');
    return listSlot.assignedElements().length > 0 ? listSlot.assignedElements()[0] : undefined;
  }

  initializeComboBox() {
    if (this.searchInput && this.list) {
      this.combobox = new Combobox(this.searchInput, this.list)
      // when options appear, start intercepting keyboard events for navigation
      this.combobox.start();
    }
  }

  disconnectedCallback() {
    this.combobox && this.combobox.stop();
  }

  get searchInput() {
    return this.shadowRoot.querySelector('input');
  }
}

customElements.define('autocomplete-input', AutocompleteInputElement)