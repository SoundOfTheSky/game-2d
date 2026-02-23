import UIButton from './ui-button'

export default class UIMenu extends HTMLElement {
  protected index = 0
  protected buttons: UIButton[] = []

  public constructor() {
    super()
    const shadow = this.attachShadow({ mode: 'open' })
    const template = document.createElement('template')
    template.innerHTML = `
        <style>
            :host {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 10px;
            }
        </style>
        <slot></slot>
    `
    shadow.append(template.content.cloneNode(true))
  }

  protected connectedCallback() {
    this.buttons = [...this.querySelectorAll<UIButton>('ui-button')]
    if (this.buttons.length > 0)
      this.buttons[
        this.index < this.buttons.length ? this.index : 0
      ]!.shadowRoot!.querySelector('button')!.focus()
  }

  public up() {
    this.buttons[this.index]!.shadowRoot!.querySelector('button')!.blur()
    this.index--
    if (this.index < 0) this.index = this.buttons.length - 1
    this.buttons[this.index]!.shadowRoot!.querySelector('button')!.focus()
  }

  public down() {
    this.buttons[this.index]!.shadowRoot!.querySelector('button')!.blur()
    this.index++
    if (this.index >= this.buttons.length) this.index = 0
    this.buttons[this.index]!.shadowRoot!.querySelector('button')!.focus()
  }

  public pressCurrent() {
    this.buttons[this.index]!.shadowRoot!.querySelector('button')!.click()
  }
}
