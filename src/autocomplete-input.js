import Combobox from '@github/combobox-nav';
import debounce from './debounce.js';
import { LitElement, html, css } from 'lit';

export class AutocompleteInputElement extends LitElement {
  static formAssociated = true;
  static styles = css`
    .input-wrapper {
      position: relative;
      display: inline-block;
      width: 100%;
    }
    
    input {
      width: 100%;
      padding-right: 30px; /* Make room for the cancel icon */
    }
    
    .cancel-icon {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      cursor: pointer;
      font-size: 18px;
      color: #666;
      border: none;
      background: none;
      padding: 4px;
      line-height: 1;
    }
    
    .cancel-icon:hover {
      color: #333;
    }

    .display-wrapper {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
    }

    .edit-icon {
      color: #666;
      font-size: 14px;
      display: inline-flex;
      align-items: center;
    }

    .display-wrapper:hover .edit-icon {
      color: #333;
    }
  `;

  static properties = {
    value: {},
    name: {},
    labelProperty: {
      type: String,
      attribute: 'label-property',
    },
    valueProperty: {
      type: String,
      attribute: 'value-property',
    },
    displayValue: {
      type: String,
      attribute: 'display-value',
    },
    items: { type: Array },
    debounce: { type: Number },
    minLength: { type: Number, attribute: 'min-length' },
    searchValue: { attribute: 'search-value' },
    clearListOnSelect: { attribute: 'clear-list-on-select', type: Boolean },
    open: { type: Boolean},
  }

  constructor() {
    super();
    this.labelProperty = 'name';
    this.valueProperty = 'id';
    this.searchValue = '';
    this.displayValue = 'Choose an organization';
    this.debounce = 300;
    this.minLength = 3;
    this.items = [];
    this.elementInternals = this.attachInternals();
  }

  cancel() {
    this.open = false;
    this.items = [];
  }

  startSearch() {
    this.open = true;
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
    return this.open ? html`
      <div class="input-wrapper">
        <input name="${this.name}" .value="${this.searchValue}" @keydown=${this.onKeyDown} part="input" autocomplete="off" @input=${debounce((e) => this.onSearch(e), this.debounce)}>
        <button class="cancel-icon" slot="cancel-icon" @click=${this.cancel} aria-label="Clear input">×</button>
      </div>
      ${this.items.length > 0 ? html`
        <ul part="list">
          ${this.items.map((item) => html`<li role="option" part="option" data-value="${item[this.valueProperty]}">${item[this.labelProperty]}</li>`)}
        </ul>
      ` : ''}
    ` : html`
      <div class="display-wrapper" @click=${this.startSearch}>
        <span>${this.displayValue}</span>
        <svg class="edit-icon" slot="edit-icon" aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Zm.176 4.823L9.75 4.81l-6.286 6.287a.253.253 0 0 0-.064.108l-.558 1.953 1.953-.558a.253.253 0 0 0 .108-.064Zm1.238-3.763a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354Z"/>
        </svg>
      </div>
    `;
  }

  onKeyDown(e) {
    if (e.key == 'Escape') {
      this.cancel();
      e.stopPropagation();
    }
  }

  onSearch(e) {
    if (this.searchInput.value.length >= this.minLength) {
      this.elementInternals.states.add('searching');
      this.dispatchEvent(
        new CustomEvent('autocomplete-search', { detail: { query: this.searchInput.value } }));
    }
  }

  onCommit({ target }) {
    this.open = false;
    this.displayValue = target.dataset.label ? target.dataset.label : target.innerText;
    this.value = target.dataset.value;
    if (this.elementInternals.form) {
      this.elementInternals.setFormValue(target.dataset.value);
    }
    if (this.clearListOnSelect) {
      this.items = [];
    }
    this.dispatchEvent(new CustomEvent('autocomplete-commit', { detail: target.dataset, bubbles: true }));
  }

  get list() {
    return this.shadowRoot.querySelector('ul');
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
      this.list.addEventListener('combobox-select', (e) => {
        this.list.querySelectorAll('li').forEach((li) => li.setAttribute('part', 'option'));
        e.target.setAttribute('part', 'selected-option');
      });
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