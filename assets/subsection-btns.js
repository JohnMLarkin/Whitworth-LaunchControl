const settings = require('electron-settings')

const subsectionBtns = document.querySelectorAll('.js-container-target')
// Listen for subsection button clicks
Array.prototype.forEach.call(subsectionBtns, function (btn) {
  btn.addEventListener('click', function (event) {
    const parent = event.target.parentElement

    // Toggles the "is-open" class on the subsection's parent element.
    parent.classList.toggle('is-open')

    // Saves the active subsection if it is open, or clears it if the subsection was user
    // collapsed by the user
    if (parent.classList.contains('is-open')) {
      settings.set('activeSubsectionButtonId', event.target.getAttribute('id'))
    } else {
      settings.delete('activeSubsectionButtonId')
    }
  })
})

// Default to the subsection that was active the last time the app was open
const buttonId = settings.get('activeSubsectionButtonId')
if (buttonId) {
  document.getElementById(buttonId).click()
}
