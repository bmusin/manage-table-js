drop table if exists bg_records;
drop table if exists bg_cats;

create table bg_cats (
    id bigint unsigned not null auto_increment,
    letter char(1) not null,
    description varchar(100),
    primary key (id)
);

create table bg_records (
    id bigint unsigned not null auto_increment,
    name varchar(100),
    surname varchar(100),
    patronymic varchar(100),
    doc_num varchar(100),
    subtype varchar(200),
    cat_id bigint unsigned not null,
    primary key(id),
    foreign key (cat_id)
        references bg_cats (id)
        on delete cascade
);
