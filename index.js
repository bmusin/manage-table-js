/* global alert, fetch, getRecordsTable, globalThis, sessionStorage */

'use strict'

const ERROR_CREATE_RECORD_SUCCESS = '0'
const ERROR_CREATE_RECORD_UC_VIOLATION = '23000'
const ERROR_CREATE_RECORD_EMPTY_FIELDS = '23001'
const ERROR_UNKNOWN = '23003'
const ERROR_UPDATE_RECORD_DOESNT_EXIST = '23004'
const ERROR_RECORD_DOCNUM_ALREADY_EXISTS = '23005'

const ERROR_MESSAGES = new Map(
  [
    [ERROR_CREATE_RECORD_SUCCESS,
      'Success'],
    [ERROR_CREATE_RECORD_UC_VIOLATION,
      'That document number is already used.'],
    [ERROR_CREATE_RECORD_EMPTY_FIELDS,
      'Some input fields were empty.'],
    [ERROR_UNKNOWN,
      'Unknown error.'],
    [ERROR_UPDATE_RECORD_DOESNT_EXIST,
      "Record with this ID doesn't exist."],
    [ERROR_RECORD_DOCNUM_ALREADY_EXISTS,
      'Record with this docnum already exists.']
  ]
)

const errorHandler = err => console.error(err)

const q = document.querySelector.bind(document)
const qa = document.querySelectorAll.bind(document)
const ce = document.createElement.bind(document)

window.addEventListener('DOMContentLoaded', () => {
  globalThis._recordsTable = new RecordsTable()
  globalThis.getRecordsTable = () => globalThis._recordsTable

  setupForm()

  getCreateButton()
    .addEventListener('click', createRecordButtonHandler, { once: true })

  getReloadButton()
    .addEventListener('click', reloadButtonHandler)

  getEditButton()
    .addEventListener('click', editButtonHandler)

  getDeleteButton()
    .addEventListener('click', deleteButtonHandler)

  getDocnumInput()
    .addEventListener('keydown', validateNumOnlyDocnum)
})

function createRecordButtonHandler (e) {
  e.preventDefault()
  showForm({ method: 'create' })
}

async function reloadButtonHandler (e) {
  e.preventDefault()
  try {
    const response = await fetch('/index.php/records',
      { headers: { Accept: 'application/json' } })
    const { records } = await response.json()

    hideEditButton()
    hideDeleteButton()
    getRecordsTable().rebuild(records)
  } catch (err) {
    errorHandler(err)
  }
}

function editButtonHandler (e) {
  e.preventDefault()
  getCreateButton().removeEventListener('click', createRecordButtonHandler)
  showForm({ method: 'update' })
}

async function deleteButtonHandler () {
  try {
    const response = await fetch('/index.php/records', {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ids: recordsToDelete() })
    })
    const { records } = await response.json()

    getRecordsTable().rebuild(records)
  } catch (err) {
    errorHandler(err)
  }
}

function showForm (task) {
  getCreateButton().textContent = 'Back'
  getCreateButton().addEventListener('click', backButtonHandler, { once: true })

  setFormSubmitHandler(task)
  reattachFormHandler()

  hideReloadButton()
  hideEditButton()
  hideDeleteButton()

  if (task.method === 'create') {
    getRecordForm().reset()
  } else if (task.method === 'update') {
    populateForm()
    sessionStorage.setItem('selectedRow', getSelectedRecordTrId())
  }
  makeVisible(getRecordForm())

  getRecordsTable().hide()
}

const validateForm = () => {
  const prefix = 'form__input-text'

  const inputs = ['name', 'surname', 'patronymic', 'doc_num', 'subtype']
    .map(fieldName => q(`.${prefix}_${fieldName}`))

  const invalidInputs = inputs
    .filter(input => {
      if (input.value === '') {
        input.classList.add(`${prefix}_error`)
        return true
      }
      return false
    })

  invalidInputs.forEach(input =>
    setTimeout(() => input.classList.remove(`${prefix}_error`), 1000))

  return !invalidInputs.length
}

function validateNumOnlyDocnum (e) {
  const errorClass = 'form__input-text_error'
  const showError = e => e.classList.add(errorClass)
  const hideError = (e, timeout = 0) => {
    setTimeout(() => e.classList.remove(errorClass), timeout)
  }

  if (/^\D$/.test(e.key)) {
    e.preventDefault()

    showError(getDocnumInput())
    hideError(getDocnumInput(), 1000)
  } else {
    hideError(getDocnumInput())
  }
}

const getFormInput = () => {
  const prefix = '.form__input-text'
  return {
    name: q(`${prefix}_name`).value,
    surname: q(`${prefix}_surname`).value,
    patronymic: q(`${prefix}_patronymic`).value,
    doc_num: q(`${prefix}_doc_num`).value,
    subtype: q(`${prefix}_subtype`).value,
    cat_id: getCatValue()
  }
}

const getCatValue = () => (
  [...qa('input[name=cat_id]')]
    .find(rb => rb.checked).value
)

function populateForm () {
  [...document.getElementById(getSelectedRecordTrId())
    .parentNode.children]
    .forEach(td => {
      ['name', 'surname', 'patronymic', 'doc_num', 'subtype']
        .forEach(field => {
          if (td.hasAttribute(field)) {
            q(`.form__input-text_${field}`)
              .value = td.getAttribute(field)
          }
        })
    })
}

async function createRecordSubmitHandler (task) {
  if (!validateForm()) {
    reattachFormHandler()
    return
  }

  const requestBodyInJson = getFormInput()
  requestBodyInJson.method = task.method
  if (task.method === 'update') {
    requestBodyInJson.id = sessionStorage.getItem('selectedRow')
  }

  try {
    const response = await fetch('/index.php/records', {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBodyInJson)
    })
    const { message, records } = await response.json()

    if (message === ERROR_CREATE_RECORD_SUCCESS) {
      sessionStorage.removeItem('selectedRow')
      sessionStorage.setItem('state', 'AFTER_REQUEST')

      getRecordForm().reset()
      makeNonVisible(getRecordForm())
      getRecordsTable().rebuild(records)

      getCreateButton().click()
    } else {
      alert(ERROR_MESSAGES.get(message))
      reattachFormHandler()
    }
  } catch (err) {
    errorHandler(err)
  }
}

function reattachFormHandler () {
  getRecordForm().addEventListener('submit', getFormSubmitHandler(), { once: true })
}

function backButtonHandler () {
  if (sessionStorage.getItem('state') !== 'AFTER_REQUEST') {
    getRecordForm().removeEventListener('submit', getFormSubmitHandler())
  } else {
    sessionStorage.removeItem('state')
  }
  makeNonVisible(getRecordForm())

  showReloadButton()
  getCreateButton().textContent = 'Create new record'
  getCreateButton().addEventListener('click', createRecordButtonHandler, { once: true })

  getRecordsTable().display()
  getReloadButton().click()
}

async function setupForm () {
  try {
    const response = await fetch('/index.php/cats',
      { headers: { Accept: 'application/json' } })
    const cats = await response.json()

    let alreadyChecked = false
    cats.forEach(cat => {
      const rb = ce('input')
      rb.id = cat.id
      rb.setAttribute('type', 'radio')
      rb.setAttribute('name', 'cat_id')
      rb.setAttribute('value', cat.id)

      if (!alreadyChecked) {
        rb.setAttribute('checked', '')
        alreadyChecked = true
      }

      const label = ce('label')
      label.setAttribute('for', cat.id)
      label.appendChild(document.createTextNode(`${cat.letter} (${cat.description})`))
      label.appendChild(rb)

      getSubmitButton().before(label)
      getSubmitButton().before(ce('br'))
    })
  } catch (err) {
    errorHandler(err)
  }
}

function toggleRowSelection (tr) {
  isRecordTrSelected(tr) ? deselectRecordTr(tr) : selectRecordTr(tr)
}

function selectRecordTr (tr) {
  tr.classList.add('table__tr_selected')

  isOnlyOneRecordTrSelected() ? showEditButton() : hideEditButton()
  showDeleteButton()
}

function deselectRecordTr (tr) {
  tr.classList.remove('table__tr_selected')

  if (!isAnyRecordTrSelected()) {
    hideDeleteButton()
    hideEditButton()
  } else {
    isOnlyOneRecordTrSelected() ? showEditButton() : hideEditButton()
    showDeleteButton()
  }
}

const isAnyRecordTrSelected = () => getRecordTrs().some(isRecordTrSelected)

const isOnlyOneRecordTrSelected = () => {
  var selected = 0
  for (const tr of getRecordTrs()) {
    if (isRecordTrSelected(tr)) {
      if (++selected === 2) {
        return false
      }
    }
  }
  return selected === 1
}

const isRecordTrSelected = tr => tr.classList.contains('table__tr_selected')

const getSelectedRecordTrId = () =>
  getRecordTrId(getRecordTrs().find(tr => isRecordTrSelected(tr)))

const getRecordTrId = tr => (
  [...tr.children]
    .find(td => td.hasAttribute('id'))
    .getAttribute('id')
)

const getRecordTrs = () => [...qa('.table__tr')]

const recordsToDelete = () => {
  const ids = []
  getRecordTrs()
    .forEach(tr => {
      if (isRecordTrSelected(tr)) {
        ids.push(getRecordTrId(tr))
      }
    })
  return ids
}

class RecordsTable {
  constructor (records) {
    const tableNode = q('table')

    if (!tableNode) {
      document.body.appendChild(ce('table'))
    }

    this._tableNode = tableNode
    this.setRecords(records)
    this.setTableClickHandlers()
  }

  rebuild (records) {
    this
      .setRecords(records)
      .rebuildTable()
      .makeVisible(true)
  }

  rebuildTable () {
    return this
      .builder()
      .setBody()
      .setTableClickHandlers()
  }

  makeVisible (isVisible) {
    this._tableNode.style.visibility = isVisible ? 'visible' : 'hidden'
  }

  builder () {
    const oldTn = this._tableNode
    const newTn = ce('table')
    newTn.classList.add('table')

    this._tableNode = newTn
    oldTn.parentNode.replaceChild(newTn, oldTn)
    return this
  }

  setRecords (records) {
    this.records = records
    return this
  }

  setBody () {
    function createTh (thName) {
      const th = ce('th')
      th.classList.add('table__th')
      th.textContent = thName
      return th
    }

    function createTd (tr, key, value) {
      const td = tr.insertCell()
      td.classList.add('table__td')
      td.setAttribute(key, value)
      td.textContent = value
    }

    const tr = this._tableNode.createTHead().insertRow()
    tr.classList.add('table__tr-head');
    [
      'ID', 'Name', 'Surname', 'Patronymic',
      'Document number', 'Subtype', "Owner's category"
    ].forEach(name => tr.appendChild(createTh(name)))

    this.records.forEach(record => {
      const tr = this._tableNode.insertRow()
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

  setTableClickHandlers () {
    this._tableNode.addEventListener('click', ({ target: td }) => {
      const tr = td.parentNode

      if (!tr.classList.contains('table__tr-head')) {
        toggleRowSelection(tr)
      }
    })
    return this
  }

  display () { this._tableNode.style.display = 'block' }

  hide () { this._tableNode.style.display = 'none' }
}

function setFormSubmitHandler (task) {
  globalThis.formSubmitHandlerAcceptingTask = e => {
    e.preventDefault()
    createRecordSubmitHandler(task)
  }
}

const getRecordForm = () => q('.form')

const getDocnumInput = () => q('.form__input-text_doc_num')

const getSubmitButton = () => q('.form__btn-submit')

const getFormSubmitHandler = () => globalThis.formSubmitHandlerAcceptingTask

const getCreateButton = () => q('.btn_create-back-combined')

const getReloadButton = () => q('.btn_reload')

const getEditButton = () => q('.btn_edit')

const getDeleteButton = () => q('.btn_delete')

const showReloadButton = () => makeVisible(getReloadButton())

const hideReloadButton = () => makeNonVisible(getReloadButton())

const showEditButton = () => makeVisible(getEditButton())

const hideEditButton = () => makeNonVisible(getEditButton())

const showDeleteButton = () => makeVisible(getDeleteButton())

const hideDeleteButton = () => makeNonVisible(getDeleteButton())

const makeVisible = el => { el.style.visibility = 'visible' }

const makeNonVisible = el => { el.style.visibility = 'hidden' }
