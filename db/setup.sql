DROP DATABASE IF EXISTS data_processing;
CREATE DATABASE data_processing;
\c data_processing;

CREATE TABLE systems(id INT, name VARCHAR(50), company VARCHAR(50), contacts TEXT[], address VARCHAR(72));
CREATE TABLE data(id SERIAL PRIMARY KEY, customer_id INT, type VARCHAR(12), made_at DATE, data TEXT);

INSERT INTO systems(id, name, company, contacts, address) VALUES (1, 'Northwood Terrace', 'David Associates', '{"rrahne@davidassociates.biz", "jtosupernorthwood@gmail.com", "jtosuperwestwood@gmail.com"}', '160-10 89th Ave');
INSERT INTO systems(id, name, company, contacts, address) VALUES (2, 'Arman Building', 'New Bedford Property Management', '{"yona@nbmgmt.com" , "marlasmith17@gmail.com", "johnaliceasantos@gmail.com"}', '482 Greenwich St');
INSERT INTO systems(id, name, company, contacts, address) VALUES (
    3, 'Tribecca House', 'Clipper Equity',
    '{"Mgordon@clipperequity.com", "Marcus@clipperequity.com", "naimavdiu2@gmail.com", "Williamfenus@gmail.com", "Mike27mayo@gmail.com", "Wellreyes@yahoo.com"}',
    '50 Murray Street'
);
