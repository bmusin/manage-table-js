/* global alert, fetch, globalThis, sessionStorage */

'use strict'

const DB_ERROR_CREATE_RECORD_SUCCESS = '0'
const DB_ERROR_CREATE_RECORD_UC_VIOLATION = '23000'
const DB_ERROR_CREATE_RECORD_EMPTY_FIELDS = '23001'
const DB_ERROR_UNKNOWN_CREATE_RECORD = '23003'
const DB_ERROR_UPDATE_RECORD_DOESNT_EXIST = '23004'
const DB_ERROR_RECORD_DOCNUM_ALREADY_EXISTS = '23005'

const ERROR_MESSAGES = new Map([
  [DB_ERROR_CREATE_RECORD_SUCCESS, 'Success'],

  [DB_ERROR_CREATE_RECORD_UC_VIOLATION, 'That document number is already used.'],
  [DB_ERROR_CREATE_RECORD_EMPTY_FIELDS, 'Some input fields were empty.'],
  [DB_ERROR_UNKNOWN_CREATE_RECORD, 'Unknown error.'],
  [DB_ERROR_UPDATE_RECORD_DOESNT_EXIST, "Record with this ID doesn't exist."],
  [DB_ERROR_RECORD_DOCNUM_ALREADY_EXISTS, 'Record with this docnum already exists.']
])

window.addEventListener('DOMContentLoaded', (_) => {
  globalThis.formSubmitHandlerAcceptingTask = null

  RecordsTable.setTableClickHandlers()

  getCreateRecordFormButton()
    .addEventListener('click', createRecordButtonHandler, RUN_LISTENER_ONCE)

  getReloadButton()
    .addEventListener('click', reloadRecordsHandler)

  // Not 'once' because serves one function, not two
  // (as create button: create button and back button.
  getEditButton()
    .addEventListener('click', (e) => {
      e.preventDefault()
      setFormMethod('update')
      getCreateRecordFormButton().removeEventListener('click', createRecordButtonHandler)
      showCreateRecordForm({ method: 'update' })
    })

  getDeleteRecordsButton()
    .addEventListener('click', deleteRecordsHandler)

  addCategoryInputToForm()

  getDocNumInput().addEventListener('keydown', function (e) {
    if (/^\D$/.test(e.key)) {
      e.preventDefault()
      this.classList.add('form__input-text_error')
      setTimeout(() => this.classList.remove('form__input-text_error'), 1 * 1000)
    } else {
      this.classList.remove('form__input-text_error')
    }
  })
})

function createRecordButtonHandler (e) {
  e.preventDefault()
  setFormMethod('create')
  showCreateRecordForm({ method: 'create' })
}

function showCreateRecordForm (task) {
  getCreateRecordFormButton().textContent = 'Back'
  getCreateRecordFormButton()
    .addEventListener(
      'click',
      backButtonHandler,
      RUN_LISTENER_ONCE
    )

  setFormSubmitHandler(task)
  reattachFormHandler()

  makeVisible(getRudButtons(), false)
  if (task.method === 'update') {
    populateUpdateForm()

    sessionStorage.setItem('selectedRow', getSelectedRecordTrId())
  }
  RecordsTable.deselectRecordRows()
  insertIntoDom(getRecordsTable(), false)

  makeVisible(getRecordForm(), true)
}

function backButtonHandler () {
  if (sessionStorage.getItem('state') !== 'AFTER_REQUEST') {
    getRecordForm().removeEventListener('submit', getFormSubmitHandler())
  } else {
    sessionStorage.removeItem('state')
  }

  getBackButton().textContent = 'Create new record'
  makeVisible(getRecordForm(), false)

  makeVisible(getRudButtons(), true)
  insertIntoDom(getRecordsTable(), true)

  getCreateRecordFormButton().addEventListener(
    'click',
    createRecordButtonHandler,
    RUN_LISTENER_ONCE
  )
  removeMethod()

  getReloadButton().click()
}

const getFormInput = () => {
  const prefix = '.form__input-text'
  return {
    name: document.querySelector(`${prefix}_name`).value,
    surname: document.querySelector(`${prefix}_surname`).value,
    patronymic: document.querySelector(`${prefix}_patronymic`).value,
    doc_num: document.querySelector(`${prefix}_doc_num`).value,
    subtype: document.querySelector(`${prefix}_subtype`).value,
    cat_id: getCatValue()
  }
}

const validateForm = () => {
  const prefix = 'form__input-text'
  return ['name', 'surname', 'patronymic', 'doc_num', 'subtype']
    .map((field) => document.querySelector(`.${prefix}_${field}`))
    .filter((el) =>
      el.value === ''
        ? !!((() => el.classList.add(`${prefix}_error`))(), true)
        : false
    )
    .reduce((_, el) => {
      setTimeout(
        () => el.classList.remove(`${prefix}_error`),
        1000
      )
      return false
    }, true)
}

function createRecordSubmitHandler (task) {
  if (!validateForm()) {
    reattachFormHandler()
    return
  }
  const requestBodyInJson = getFormInput()

  requestBodyInJson.method = task.method
  if (task.method === 'update') {
    requestBodyInJson.id = sessionStorage.getItem('selectedRow')
  }

  fetch('/index.php/records', {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBodyInJson)
  })
    .then((response) => response.json())
    .then(({ message, records }) => {
      if (message === DB_ERROR_CREATE_RECORD_SUCCESS) {
        sessionStorage.removeItem('selectedRow')
        sessionStorage.setItem('state', 'AFTER_REQUEST')

        getRecordForm().reset()
        RecordsTable.rebuildTable(records, true)

        getCreateRecordFormButton().click()
      } else {
        alert(ERROR_MESSAGES.get(message))

        reattachFormHandler()
      }
    })
    .catch((error) => console.error('Error:', error))
}

function populateUpdateForm () {
  [...document.getElementById(getSelectedRecordTrId())
    .parentNode.children]
    .forEach((td) => {
      ['name', 'surname', 'patronymic', 'doc_num', 'subtype']
        .forEach((field) => {
          if (td.hasAttribute(field)) {
            document.querySelector(`.form__input-text_${field}`).value = td.getAttribute(field)
          }
        })
    })
}

function reattachFormHandler () {
  getRecordForm()
    .addEventListener(
      'submit',
      getFormSubmitHandler(),
      RUN_LISTENER_ONCE
    )
}

const getCatValue = () => (
  [...document.querySelectorAll('input[name=cat_id]')]
    .find((rb) => rb.checked).value
)

function addCategoryInputToForm () {
  let alreadyChecked = false

  fetch('/index.php/cats', {
    method: 'GET',
    headers: {
      Accept: 'application/json'
    }
  })
    .then((response) => response.json())
    .then((cats) => {
      cats.forEach((cat) => {
        const label = document.createElement('label')
        const rb = document.createElement('input')

        rb.id = cat.id
        rb.setAttribute('type', 'radio')
        rb.setAttribute('name', 'cat_id')
        rb.setAttribute('value', cat.id)

        if (!alreadyChecked) {
          rb.setAttribute('checked', '')
          alreadyChecked = true
        }

        label.setAttribute('for', cat.id)
        label.appendChild(document.createTextNode(`${cat.letter} (${cat.description})`))
        label.appendChild(rb)

        getSubmitButton().before(label)
        getSubmitButton().before(document.createElement('br'))
      })
    })
    .catch((error) => console.error('Error:', error))
}

function deselectRecordTr (tr) {
  tr.classList.remove('table__tr_selected')

  if (!isAnyRecordTrSelected()) {
    hideDeleteRecordsButton()
    hideEditButton()
  } else {
    isOnlyOneRecordTrSelected() ? showEditButton() : hideEditButton()
    showDeleteRecordsButton()
  }
}

function selectRecordTr (tr) {
  tr.classList.add('table__tr_selected')

  isOnlyOneRecordTrSelected() ? showEditButton() : hideEditButton()
  showDeleteRecordsButton()
}

function toggleRowSelection (tr) {
  isRecordTrSelected(tr) ? deselectRecordTr(tr) : selectRecordTr(tr)
}

function reloadRecordsHandler (e) {
  e.preventDefault()
  fetch('/index.php/records', {
    method: 'GET',
    headers: {
      Accept: 'application/json'
    }
  })
    .then((response) => response.json())
    .then((data) => RecordsTable.rebuildTable(data.records, true))
    .catch((error) => console.error('Error:', error))
}

function deleteRecordsHandler () {
  fetch('/index.php/records', {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ids: recordsToDelete() })
  })
    .then((response) => response.json())
    .then(({ records }) => RecordsTable.rebuildTable(records, true))
    .catch((error) => console.error('Error:', error))
}

const isAnyRecordTrSelected = () => [...getRecordTrs()].some(isRecordTrSelected)

const isOnlyOneRecordTrSelected = () => {
  let selected = 0
  return [...getRecordTrs()].every((tr) => {
    if (isRecordTrSelected(tr)) {
      return ++selected
    }
    return selected < 2
  }) && selected !== 0
}

const isRecordTrSelected = (tr) => tr.classList.contains('table__tr_selected')

const getRecordTrs = () => document.querySelectorAll('.table__tr')

const getRecordTrId = ({ children }) => (
  [...children]
    .find((td) => td.hasAttribute('id'))
    .getAttribute('id')
)

const getSelectedRecordTrId = () => (
  getRecordTrId(
    [...getRecordTrs()].find((tr) => isRecordTrSelected(tr))
  )
)

const recordsToDelete = () => (
  [...getRecordTrs()].reduce((ids, tr) => {
    if (isRecordTrSelected(tr)) {
      ids.push(getRecordTrId(tr))
    }
    return ids
  }, [])
)

class RecordsTable {
  static getRecordsTable (data) {
    const tableNode = document.querySelector('table')

    if (!tableNode) {
      const tableNode = document.createElement('table')
      document.body.appendChild(tableNode)
    }

    const recordsTable = new RecordsTable()
    recordsTable.tableNode = tableNode
    recordsTable.data = data
    return recordsTable
  }

  get data () {
    return this._data
  }

  set data (data) {
    this._data = data
  }

  get tableNode () {
    return this._tableNode
  }

  set tableNode (tn) {
    this._tableNode = tn
  }

  rebuildTable (shouldMakeVisible) {
    return this
      .builder(shouldMakeVisible)
      .setCaption()
      .setBody()
      .setHeader()
  }

  builder (shouldMakeVisible) {
    const oldTn = this.tableNode
    const newTn = document.createElement('table')

    makeVisible(newTn, shouldMakeVisible)
    newTn.classList.add('table')
    this.tableNode = newTn
    oldTn.parentNode.replaceChild(newTn, oldTn)
    return this
  }

  setCaption () {
    this.tableNode.createCaption().textContent = 'Records'
    return this
  }

  setHeader () {
    function createTh (thName) {
      const th = document.createElement('th')
      th.classList.add('table__th')
      th.textContent = thName
      return th
    }

    const tr = this.tableNode.createTHead().insertRow()
    tr.classList.add('table__tr-head');
    ['ID', 'Name', 'Surname', 'Patronymic',
      'Document number', 'Subtype', "Owner's category"
    ].forEach((name) => tr.appendChild(createTh(name)))

    return this
  }

  setBody () {
    function createTd (tr, key, value) {
      const td = tr.insertCell()
      td.classList.add('table__td')
      td.setAttribute(key, value)
      td.textContent = value
    }

    this.data.forEach((record) => {
      const tr = this.tableNode.insertRow()
      tr.classList.add('table__tr')
      createTd(tr, 'id', record.id)
      createTd(tr, 'name', record.name)
      createTd(tr, 'surname', record.surname)
      createTd(tr, 'patronymic', record.patronymic)
      createTd(tr, 'doc_num', record.doc_num)
      createTd(tr, 'subtype', record.subtype)
      createTd(tr, 'cat_id', `${record.letter} (${record.description})`)
    })
    return this
  }

  static setTableClickHandlers () {
    getRecordTrs()
      .forEach((tr) => {
        tr.addEventListener('click', toggleRowSelection.bind(null, tr))
      })
  }

  static deselectRecordRows () {
    getRecordTrs()
      .forEach((tr) => {
        if (isRecordTrSelected(tr)) {
          deselectRecordTr(tr)
        }
      })
  }

  static rebuildTable (data, shouldMakeVisible) {
    RecordsTable.deselectRecordRows()

    RecordsTable
      .getRecordsTable(data)
      .rebuildTable(shouldMakeVisible)

    RecordsTable.setTableClickHandlers()
  }
}

const setFormMethod = (method) => sessionStorage.setItem('method', method)

const removeMethod = () => sessionStorage.removeItem('method')

const getRecordsTable = () => document.querySelector('.table')

const getRecordForm = () => document.querySelector('.form')

const getRudButtons = () => document.querySelector('.btn-group_rud')

const getReloadButton = () => document.querySelector('.btn_reload')

const getCreateRecordFormButton = () => document.querySelector('.btn_create-back-combined')

const getDocNumInput = () => document.querySelector('.form__input-text_doc_num')

const getSubmitButton = () => document.querySelector('.form__btn-submit')

const getBackButton = getCreateRecordFormButton

const getEditButton = () => document.querySelector('.btn_edit')

const getDeleteRecordsButton = () => document.querySelector('.btn_delete')

function setFormSubmitHandler (task) {
  globalThis.formSubmitHandlerAcceptingTask = (e) => {
    e.preventDefault()
    createRecordSubmitHandler(task)
  }
}

const getFormSubmitHandler = () => globalThis.formSubmitHandlerAcceptingTask

const RUN_LISTENER_ONCE = { once: true }

function showDeleteRecordsButton () {
  makeVisible(getDeleteRecordsButton(), true)
}

function hideDeleteRecordsButton () {
  makeVisible(getDeleteRecordsButton(), false)
}

function showEditButton () {
  makeVisible(getEditButton(), true)
}

function hideEditButton () {
  makeVisible(getEditButton(), false)
}

function makeVisible (el, isVisible) {
  el.style.visibility = isVisible ? 'visible' : 'hidden'
}

function insertIntoDom (el, toInsert) {
  el.style.display = toInsert ? 'block' : 'none'
}
