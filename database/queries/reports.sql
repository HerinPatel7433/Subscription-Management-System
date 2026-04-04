-- =============================================================================
-- database/queries/reports.sql
-- Reporting queries for the Subscription Management System — Reports Module
-- Compatible with PostgreSQL 13+
-- =============================================================================


-- ---------------------------------------------------------------------------
-- REPORT 1: Count of active subscriptions per plan
-- ---------------------------------------------------------------------------
-- Shows how many currently active subscriptions each recurring plan has.
-- Use this to understand plan popularity and adoption.
-- ---------------------------------------------------------------------------
SELECT
    rp.id                                   AS plan_id,
    rp.name                                 AS plan_name,
    rp.billing_period,
    rp.price                                AS plan_price,
    COUNT(s.id)                             AS active_subscription_count
FROM recurring_plans rp
LEFT JOIN subscriptions s
    ON s.plan_id  = rp.id
    AND s.status  = 'active'
    AND s.deleted_at IS NULL
WHERE rp.deleted_at IS NULL
GROUP BY rp.id, rp.name, rp.billing_period, rp.price
ORDER BY active_subscription_count DESC;


-- ---------------------------------------------------------------------------
-- REPORT 2: Total revenue grouped by month
-- ---------------------------------------------------------------------------
-- Sums total_amount from PAID invoices, bucketed by calendar month.
-- Only considers invoices that are not soft-deleted.
-- ---------------------------------------------------------------------------
SELECT
    DATE_TRUNC('month', i.issued_date)      AS revenue_month,
    TO_CHAR(i.issued_date, 'Month YYYY')    AS month_label,
    COUNT(i.id)                             AS paid_invoice_count,
    SUM(i.total_amount)                     AS total_revenue
FROM invoices i
WHERE i.status     = 'paid'
  AND i.deleted_at IS NULL
GROUP BY DATE_TRUNC('month', i.issued_date), TO_CHAR(i.issued_date, 'Month YYYY')
ORDER BY revenue_month DESC;


-- ---------------------------------------------------------------------------
-- REPORT 3: Overdue invoices  (due_date < today AND status <> 'paid')
-- ---------------------------------------------------------------------------
-- Lists all open invoices whose due date has already passed.
-- Useful for accounts-receivable follow-ups.
-- ---------------------------------------------------------------------------
SELECT
    i.id                                    AS invoice_id,
    i.subscription_id,
    u.name                                  AS customer_name,
    u.email                                 AS customer_email,
    i.status,
    i.issued_date,
    i.due_date,
    CURRENT_DATE - i.due_date               AS days_overdue,
    i.total_amount
FROM invoices i
JOIN users u
    ON u.id = i.customer_id
WHERE i.status     <> 'paid'
  AND i.due_date    < CURRENT_DATE
  AND i.deleted_at  IS NULL
  AND u.deleted_at  IS NULL
ORDER BY days_overdue DESC;


-- ---------------------------------------------------------------------------
-- REPORT 4: Payment collection rate
-- ---------------------------------------------------------------------------
-- Calculates the ratio of paid invoices to total non-deleted invoices,
-- expressed as a percentage. Also breaks this down by month for trend analysis.
-- ---------------------------------------------------------------------------

-- 4a. Overall payment collection rate
SELECT
    COUNT(*)                                                    AS total_invoices,
    COUNT(*) FILTER (WHERE status = 'paid')                     AS paid_invoices,
    COUNT(*) FILTER (WHERE status <> 'paid')                    AS unpaid_invoices,
    ROUND(
        COUNT(*) FILTER (WHERE status = 'paid') * 100.0
        / NULLIF(COUNT(*), 0),
        2
    )                                                           AS collection_rate_pct
FROM invoices
WHERE deleted_at IS NULL;

-- 4b. Monthly payment collection rate (for trend charts)
SELECT
    DATE_TRUNC('month', issued_date)                            AS invoice_month,
    TO_CHAR(issued_date, 'Month YYYY')                          AS month_label,
    COUNT(*)                                                    AS total_invoices,
    COUNT(*) FILTER (WHERE status = 'paid')                     AS paid_invoices,
    ROUND(
        COUNT(*) FILTER (WHERE status = 'paid') * 100.0
        / NULLIF(COUNT(*), 0),
        2
    )                                                           AS collection_rate_pct
FROM invoices
WHERE deleted_at IS NULL
GROUP BY DATE_TRUNC('month', issued_date), TO_CHAR(issued_date, 'Month YYYY')
ORDER BY invoice_month DESC;


-- ---------------------------------------------------------------------------
-- REPORT 5: Top 5 customers by total subscription value
-- ---------------------------------------------------------------------------
-- Ranks customers by the sum of total_amount across their PAID invoices.
-- Also shows the number of subscriptions they hold and the active ones.
-- ---------------------------------------------------------------------------
SELECT
    u.id                                        AS customer_id,
    u.name                                      AS customer_name,
    u.email                                     AS customer_email,
    COUNT(DISTINCT s.id)                        AS total_subscriptions,
    COUNT(DISTINCT s.id) FILTER (
        WHERE s.status = 'active'
          AND s.deleted_at IS NULL
    )                                           AS active_subscriptions,
    COALESCE(SUM(i.total_amount)
        FILTER (WHERE i.status = 'paid'
                  AND i.deleted_at IS NULL), 0) AS total_paid_revenue
FROM users u
LEFT JOIN subscriptions s
    ON s.customer_id = u.id
    AND s.deleted_at IS NULL
LEFT JOIN invoices i
    ON i.customer_id = u.id
WHERE u.deleted_at IS NULL
GROUP BY u.id, u.name, u.email
ORDER BY total_paid_revenue DESC
LIMIT 5;
