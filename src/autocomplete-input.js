import Combobox from '@github/combobox-nav';
import debounce from './debounce.js';
import { LitElement, html } from 'lit';

export class AutocompleteInputElement extends LitElement {
  static formAssociated = true;

  static properties = {
    value: {},
    name: {},
    debounce: { type: Number },
    minlength: { type: Number },
    searchValue: { attribute: 'search-value' },
    clearListOnSelect: { attribute: 'clear-list-on-select', type: Boolean },
    open: { type: Boolean, converter: (value, _type) => value !== 'false' },
  }

  constructor() {
    super();
    this.searchValue = '';
    this.debounce = 300;
    this.minlength = 3;
    this.elementInternals = this.attachInternals();
    this.addEventListener('click', (e) => {
      if (!this.open) {
        this.searchValue = '';
        this.open = true;
      }
    });
    this.addEventListener('focusout', (e) => {
      console.log(e);
    });
  }

  cancel() {
    this.open = false;
    setTimeout(() => this.dispatchEvent(new CustomEvent('autocomplete-close', {detail: {query: this.searchInput?.value}})));
  }

  hasState(state) {
    return this.elementInternals && this.elementInternals.states.has(state);
  }

  updated() {
    if (this.open && !this.hasState('open')) {
      this.elementInternals.states.add('open');
    }
    if (this.elementInternals.form && this.value) {
      this.elementInternals.setFormValue(this.value, this.searchValue);
    }
    if (this.open) {
      this.searchInput.focus();
    }
    this.initializeComboBox();
  }

  render() {
    return html`${this.open ? html`
    <input name="${this.name}" .value="${this.searchValue}" @keydown=${this.onKeyDown} part="input" autocomplete="off" @input=${debounce((e) => this.onSearch(e), this.debounce)}>
    ` : html`<slot></slot>`}
    <slot name="list"></slot>
    `;
  }

  onKeyDown(e) {
    if (e.key == 'Escape') {
      this.cancel();
    }
    console.log(e);
  }

  onClick(e) {
    if (!this.open) {
      this.searchValue = '';
      this.open = true;
    }
  }

  onSearch(e) {
    if (this.searchInput.value.length >= this.minlength) {
      this.elementInternals.states.add('searching');
      this.dispatchEvent(
        new CustomEvent('autocomplete-search', { detail: { query: this.searchInput.value } }));  
    }
  }

  onCommit({ target }) {
    this.open = false;
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
    return this.listSlot.assignedElements().length > 0 ? this.listSlot.assignedElements()[0] : undefined;
  }

  get listSlot() {
    return this.shadowRoot.querySelector('slot[name="list"]');
  }

  initializeComboBox() {
    if (this.searchInput && this.list && (!this.combobox || this.combobox.list !== this.list)) {
      this.combobox = new Combobox(this.searchInput, this.list)
      // when options appear, start intercepting keyboard events for navigation
      this.combobox.start();
      this.list.addEventListener('combobox-commit', (e) => this.onCommit(e));
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