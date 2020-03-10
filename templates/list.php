<?php

declare(strict_types = 1);

$title = 'Records';
$records = records();

ob_start();
?>

<button class='btn btn_create-back-combined' type="button">Create new record</button>
<div class='btn-group_rud'>
    <button class='btn btn_reload' type="button" >Reload records</button>
    <button class='btn btn_delete' type="button" >Delete records</button>
    <button class='btn btn_edit' type="button">Update record</button>
</div>

<table class='table'>
    <caption>Records</caption>
    <thead>
        <tr class='table__tr-head'>
            <th class='table__th'>ID</th>
            <th class='table__th'>Name</th>
            <th class='table__th'>Surname</th>
            <th class='table__th'>Patronymic</th>
            <th class='table__th'>Document number</th>
            <th class='table__th'>Subtype</th>
            <th class='table__th'>Owner&#39;s category</th>
        </tr>
    </thead>
    <tbody>
        <?php foreach ($records as $record) : ?>
        <tr class='table__tr'>
            <td class='table__td' id="<?= $record['id'] ?>"><?= $record['id'] ?></td>
            <td class='table__td' name="<?= $record['name'] ?>"><?= $record['name'] ?></td>
            <td class='table__td' surname="<?= $record['surname'] ?>"><?= $record['surname'] ?></td>
            <td class='table__td' patronymic="<?= $record['patronymic'] ?>"><?= $record['patronymic'] ?></td>
            <td class='table__td' doc_num="<?= $record['doc_num'] ?>"><?= $record['doc_num'] ?></td>
            <td class='table__td' subtype="<?= $record['subtype'] ?>"><?= $record['subtype'] ?></td>
            <td class='table__td' cat="<?= $record['letter'] ?>"><?= $record['letter']." (${record['description']})"?></td>
        </tr>
        <?php endforeach ?>
    </tbody>
</table>

<form class='form' method="post">
    Name:
    <input class='form__input-text form__input-text_name' type="text" name="name"><br>
    Surname:
    <input class='form__input-text form__input-text_surname' type="text" name="surname"><br>
    Patronymic:
    <input class='form__input-text form__input-text_patronymic' type="text" name="patronymic"><br>
    Document number:
    <input class='form__input-text form__input-text_doc_num' type="text" name="doc_num"><br>
    Subtype:
    <input class='form__input-text form__input-text_subtype' type="text" name="subtype"><br>
    Category (letter):
    <br>
    <input class='form__btn-submit' type="submit" value="Submit">
</form>

<?php
$content = ob_get_clean();

include 'layout.php';
?>
