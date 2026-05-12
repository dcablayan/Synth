# Spreadsheet Profile: sample-payment-schedule.csv

Sheet: Sheet1
Rows: 15, Columns: 7
Headers: Vendor, Invoice Number, Amount, Due Date, Status, Contract Reference, Notes
Entities: Acme Corp, DataStream Inc, LegalDocs Ltd, TechVendors LLC, Acme Corp Total, DataStream Inc Total, LegalDocs Ltd Total, TechVendors LLC Total
Amounts: $12500.00, $8750.00, $3200.00, $9100.00, $5500.00, $62500.00
Dates: 2024-02-15, 2024-02-28, 2024-03-15, 2024-03-20
Totals: Acme Corp Total (Invoice Number): $62500.00 | DataStream Inc Total (Invoice Number): $26950.00 | LegalDocs Ltd Total (Invoice Number): $6400.00 | TechVendors LLC Total (Invoice Number): $5500.00
Detected: payment schedule
Detected: invoice
Detected: vendor list
Warnings: 1 row(s) marked as overdue

Sample rows (5):
Acme Corp	INV-2024-001	$12500.00	2024-02-15	Paid	SaaS-2024-001	Monthly license fee
DataStream Inc	INV-2024-002	$8750.00	2024-02-28	Paid	SaaS-2024-001	Overage charges Feb
Acme Corp	INV-2024-003	$12500.00	2024-03-15	Paid	SaaS-2024-001	Monthly license fee
LegalDocs Ltd	INV-2024-004	$3200.00	2024-03-20	Paid	CONSULTING-2024-02	Legal review retainer
DataStream Inc	INV-2024-005	$9100.00	2024-03-31	Overdue	SaaS-2024-001	Overage charges Mar