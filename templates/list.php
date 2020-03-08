<?php

declare(strict_types = 1);

$title = 'Records';
$records = records();

ob_start();
?>

<button style="display: " type="button" id="createRecordFormButton">Create new record</button>
<div id="rudButtons">
    <button type="button" id="reloadRecordsButton">Reload records</button>
    <button type="button" id="deleteRecordsButton">Delete records</button>
    <button type="button" id="editRecordButton">Edit record</button>
</div>

<table id="recordsTable" action="/index.php/test">
    <caption>Records</caption>
    <thead>
        <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Surname</th>
            <th>Patronymic</th>
            <th>Document number</th>
            <th>Subtype</th>
            <th>Owner&#39;s category</th>
        </tr>
    </thead>
    <tbody>
        <?php foreach ($records as $record) : ?>
        <tr>
            <td id="<?= $record['id'] ?>"><?= $record['id'] ?></td>
            <td name="<?= $record['name'] ?>"><?= $record['name'] ?></td>
            <td surname="<?= $record['surname'] ?>"><?= $record['surname'] ?></td>
            <td patronymic="<?= $record['patronymic'] ?>"><?= $record['patronymic'] ?></td>
            <td doc_num="<?= $record['doc_num'] ?>"><?= $record['doc_num'] ?></td>
            <td subtype="<?= $record['subtype'] ?>"><?= $record['subtype'] ?></td>
            <td cat="<?= $record['letter'] ?>"><?= $record['letter']." (${record['description']})"?></td>
        </tr>
    <?php endforeach ?>
    </tbody>
</table>

<form id="createRecordForm" method="post">
    Name:
    <input id="create_name" type="text" name="name"><br>
    Surname:
    <input id="create_surname" type="text" name="surname"><br>
    Patronymic:
    <input id="create_patronymic" type="text" name="patronymic"><br>
    Document number:
    <input id="create_doc_num" type="text" name="doc_num"><br>
    Subtype:
    <input id="create_subtype" type="text" name="subtype"><br>
    Category (letter):
    <br>
    <input id="createFormButton" type="submit" value="Submit">
</form>

<?php
$content = ob_get_clean();

include 'layout.php';
?>
