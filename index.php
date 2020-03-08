<?php

declare(strict_types = 1);

require_once './model.php';

function setJsonContentType() : void
{
    header('Content-Type: application/json');
}

function getUrl() : string
{
    return substr(
        parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH),
        strlen('/index.php')
    );
}

function sendRecordsPage() : void
{
    require 'templates/list.php';
}

function hasAllFields($formInput) : bool
{
    return
     (property_exists($formInput, 'name') && $formInput->name !== '') &&
     (property_exists($formInput, 'surname') && $formInput->surname !== '') &&
     (property_exists($formInput, 'patronymic') && $formInput->patronymic !== '') &&
     (property_exists($formInput, 'doc_num') && $formInput->doc_num !== '') &&
     (property_exists($formInput, 'subtype') && $formInput->subtype !== '') &&
     (property_exists($formInput, 'cat_id') && $formInput->cat_id !== '');
}

function getJsonRecords() : void
{
    setJsonContentType();
    echo json_encode(['message' => DB_ERROR_NOERROR, 'records' => records()]);
}

function getJsonRecordsDelete() : void
{
    setJsonContentType();
    $ids = json_decode(file_get_contents('php://input'))->ids;
    foreach ($ids as $id) {
        deleteRecord($id);
    }
    echo json_encode(['message' => DB_ERROR_NOERROR, 'records' => records()]);
}

function getJsonCats() : void
{
    setJsonContentType();
    echo json_encode(cats());
}

function show404() : void
{
    header('HTTP/1.1 404 Not Found');
    echo '<html><body>Page Not Found</body></html>';
}

function sendJsonError(string $message) : void
{
    setJsonContentType();
    echo json_encode(['message' => $message]);
}

function route() : void
{
    switch (getUrl()) {
        case '':
            sendRecordsPage();
            break;
        case '/cats':
            getJsonCats();
            break;
        case '/records':
            switch ($_SERVER['REQUEST_METHOD']) {
                case 'GET':
                    getJsonRecords();
                    break;
                case 'DELETE':
                    getJsonRecordsDelete();
                    break;
                case 'PUT':
                    $formInput = json_decode(file_get_contents('php://input'));

                    if (!hasAllFields($formInput)) {
                        sendJsonError(DB_ERROR_CREATE_RECORD_EMPTY_FIELDS);
                    } elseif ($formInput->method === 'create') {
                        if (isFieldValueAlreadyExists('doc_num', $formInput->doc_num)) {
                            sendJsonError(DB_ERROR_RECORD_DOCNUM_ALREADY_EXISTS);
                        } else {
                            createRecord($formInput);
                            getJsonRecords();
                        }
                    } elseif ($formInput->method === 'update') {
                        if (!property_exists($formInput, 'id')) {
                            sendJsonError(DB_ERROR_CREATE_RECORD_EMPTY_FIELDS);
                        } elseif (!isFieldValueAlreadyExists('id', $formInput->id)) {
                            sendJsonError(DB_ERROR_UPDATE_RECORD_DOESNT_EXIST);
                        } else {
                            $id = idWithDocnum($formInput->doc_num);
                            if ($id && ($formInput->id !== strval($id))) {
                                sendJsonError(DB_ERROR_RECORD_DOCNUM_ALREADY_EXISTS);
                            } else {
                                updateRecord($formInput);
                                getJsonRecords();
                            }
                        }
                    }
                    break;
                default:
                    break;
            }
            break;
        default:
            show404();
            break;
    }
}

route();
