export default class UIButton extends HTMLElement {
  protected callback?: () => unknown

  protected connectedCallback() {
    const shadow = this.attachShadow({ mode: 'open' })
    const template = document.createElement('template')
    template.innerHTML = `
          <style>
              button {
                  background-color: #4caf50;
                  border: none;
                  color: white;
                  padding: 10px 20px;
                  text-align: center;
                  text-decoration: none;
                  display: inline-block;
                  font-size: 16px;
                  margin: 4px 2px;
                  cursor: pointer;
                  border-radius: 5px;
                  transition: transform 0.2s, background-color 0.2s;
              }

              button:hover, button:focus {
                  background-color: #45a049;
              }

              button:active {
                  transform: scale(0.95);
              }
          </style>
          <button>
              <slot></slot>
          </button>
      `
    shadow.append(template.content.cloneNode(true))
    shadow.querySelector('button')!.addEventListener('click', () => {
      this.callback?.()
    })
  }
}

// Define the custom element
customElements.define('ui-button', UIButton)
