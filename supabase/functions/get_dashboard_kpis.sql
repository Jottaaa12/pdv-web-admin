DROP FUNCTION IF EXISTS get_dashboard_kpis();

CREATE OR REPLACE FUNCTION get_dashboard_kpis()
RETURNS TABLE(total_faturamento bigint, total_vendas bigint, ticket_medio bigint)
LANGUAGE plpgsql
AS $$
DECLARE
    today_start timestamp with time zone := date_trunc('day', now());
    today_end timestamp with time zone := today_start + INTERVAL '1 day' - INTERVAL '1 microsecond';
    v_total_faturamento bigint := 0;
    v_total_vendas bigint := 0;
    v_ticket_medio bigint := 0;
BEGIN
    -- Calcular o faturamento total e o número de vendas para hoje
    SELECT
        COALESCE(SUM(total_amount), 0),
        COALESCE(COUNT(id), 0)
    INTO
        v_total_faturamento,
        v_total_vendas
    FROM
        sales
    WHERE
        sale_date >= today_start AND sale_date <= today_end
        AND training_mode = FALSE;

    -- Calcular o ticket médio, evitando divisão por zero
    IF v_total_vendas > 0 THEN
        v_ticket_medio := v_total_faturamento / v_total_vendas;
    ELSE
        v_ticket_medio := 0;
    END IF;

    RETURN QUERY SELECT v_total_faturamento, v_total_vendas, v_ticket_medio;
END;
$$;