<?php

declare(strict_types = 1);

require_once './consts.php';

function getConnection()
{
    $host    = DB_HOSTNAME;
    $db      = DB_DBNAME;
    $user    = DB_USERNAME;
    $pass    = DB_PASSWORD;
    $charset = DB_CHARSET;

    $dsn = "mysql:host=$host;dbname=$db;charset=$charset";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];

    $conn = null;
    try {
        $conn = new PDO($dsn, $user, $pass, $options);
    } catch (PDOException $e) {
        throw new PDOException($e->getMessage(), (int)$e->getCode());
    }
    return $conn;
}

function closeConnection(&$connection)
{
    $connection = null;
}

function records()
{
    $conn = getConnection();
    $records = $conn
        ->query(
            'select
               r.id,
               r.name,
               r.surname,
               r.patronymic,
               r.doc_num,
               r.subtype,
               c.letter,
               c.description
             from
               bg_records as r,
               bg_cats as c
             where
               c.id = r.cat_id
             order by r.id desc'
        )
        ->fetchAll(PDO::FETCH_ASSOC);
    closeConnection($conn);
    return $records;
}

function cats()
{
    $conn = getConnection();
    $cats = $conn
        ->query('select id, letter, description from bg_cats')
        ->fetchAll(PDO::FETCH_ASSOC);
    closeConnection($conn);
    return $cats;
}

function createRecord($data)
{
    $conn = getConnection();
    $st = $conn->prepare(
        'insert into bg_records
           (name, surname, patronymic, doc_num, subtype, cat_id)
         values
           (:name, :surname, :patronymic, :doc_num, :subtype, :cat_id)'
    );
    $st->execute([
        'name'       => $data->name,
        'surname'    => $data->surname,
        'patronymic' => $data->patronymic,
        'doc_num'    => $data->doc_num,
        'subtype'    => $data->subtype,
        'cat_id'     => $data->cat_id
    ]);
    closeConnection($conn);
}

function updateRecord($data)
{
    $conn = getConnection();
    $st = $conn->prepare(
        'update
           bg_records
         set
           name       = :name,
           surname    = :surname,
           patronymic = :patronymic,
           doc_num    = :doc_num,
           subtype    = :subtype,
           cat_id     = :cat_id
         where
           id = :id'
    );
    $st->execute([
            'name'       => $data->name,
            'surname'    => $data->surname,
            'patronymic' => $data->patronymic,
            'doc_num'    => $data->doc_num,
            'subtype'    => $data->subtype,
            'cat_id'     => $data->cat_id,
            'id'         => $data->id
    ]);
    closeConnection($conn);
}

function deleteRecord($id) : void
{
    $conn = getConnection();
    $st = $conn->prepare('delete from bg_records where id = ?');
    $st->execute([$id]);
    closeConnection($conn);
}

function isFieldValueAlreadyExists(string $column, string $value) : bool
{
    $conn = getConnection();
    $st = $conn->prepare("select 1 from bg_records where {$column} = ?");
    $st->execute([$value]);
    closeConnection($conn);
    return $st->rowCount() > 0;
}

function idWithDocnum(string $doc_num)
{
    $conn = getConnection();
    $st = $conn->prepare(
        'select
           id
         from
           bg_records
         where
           doc_num = :doc_num'
    );
    $st->execute(['doc_num' => $doc_num]);
    closeConnection($conn);
    return $st->fetchColumn();
}
