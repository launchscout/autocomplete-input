import Combobox from '@github/combobox-nav';
import debounce from './debounce.js';
import { LitElement, html } from 'lit';

export class AutocompleteInputElement extends LitElement {
  static formAssociated = true;

  static properties = {
    value: {},
    name: {},
    debounce: {type: Number},
    displayValue: {attribute: 'display-value'},
    clearListOnSelect: {attribute: 'clear-list-on-select', type: Boolean}
  }

  constructor() {
    super();
    this.clearListOnSelect = true;
    this.displayValue = '';
    this.debounce = 300;
    this.elementInternals = this.attachInternals();
  }

  updated() {
    if (this.elementInternals.form && this.value) {
      this.elementInternals.setFormValue(this.value, this.displayValue);
    }
    this.initializeComboBox();
  }

  render() {
    return html`
    <input name="${this.name}" .value="${this.displayValue}" part="input" autocomplete="off" @input=${debounce((e) => this.onSearch(e), this.debounce)}>
    <slot name="list" @combobox-commit=${this.onCommit}></slot>
    `
  }

  onSearch(e) {
    this.elementInternals.states.delete('closed');
    this.elementInternals.states.add('open');
    this.dispatchEvent(
      new CustomEvent('autocomplete-search', { detail: { query: this.searchInput.value } }));
  }

  onCommit({target}) {
    this.elementInternals.states.add('selected');
    this.elementInternals.states.delete('open');
    this.displayValue = target.dataset.label ? target.dataset.label : target.innerText;
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