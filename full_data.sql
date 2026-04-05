--
-- PostgreSQL database dump
--

\restrict bPAFwGzVyvJh2xmmWuuldyv8Y2wmU3daPSggFZQdEJFEIvyzlLSLKJVpOxO4g1v

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

-- Started on 2026-04-01 23:22:50

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 5013 (class 0 OID 24591)
-- Dependencies: 220
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (id, name, barcode, production_date, expiry_date, quantity, created_at, category, note) FROM stdin;
2	كيك شرين	\N	\N	2026-02-28	0	2026-03-30 23:19:08.516085	عام	دفعة جديدة
3	سلامات	\N	\N	2026-01-28	0	2026-03-30 23:43:56.071102	عام	دفعة جديدة
5	حليب	\N	\N	2026-06-30	0	2026-03-31 00:38:06.308446	عام	1
6	قوة جبل	\N	2025-12-27	2026-04-27	0	2026-03-31 00:52:57.526235	عام	1
\.


--
-- TOC entry 5015 (class 0 OID 24603)
-- Dependencies: 222
-- Data for Name: push_subscriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.push_subscriptions (id, subscription_json) FROM stdin;
\.


--
-- TOC entry 5021 (class 0 OID 0)
-- Dependencies: 219
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.products_id_seq', 6, true);


--
-- TOC entry 5022 (class 0 OID 0)
-- Dependencies: 221
-- Name: push_subscriptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.push_subscriptions_id_seq', 1, false);


-- Completed on 2026-04-01 23:22:50

--
-- PostgreSQL database dump complete
--

\unrestrict bPAFwGzVyvJh2xmmWuuldyv8Y2wmU3daPSggFZQdEJFEIvyzlLSLKJVpOxO4g1v

