/*
    Create all tables to store data.
*/
BEGIN TRANSACTION;
DROP TABLE IF EXISTS "anfr";
CREATE TABLE IF NOT EXISTS "anfr" (
	"_id"	INTEGER,
	"id"	INTEGER,
	"adm_lb_nom"	TEXT,
	"sup_id"	INTEGER,
	"emr_lb_systeme"	TEXT,
	"emr_dt_service"	TEXT,
	"sta_nm_dpt"	INTEGER,
	"code_insee"	TEXT,
	"generation"	TEXT,
	"date_maj"	TEXT,
	"total_de_adm_lb_nom"	TEXT,
	"sta_nm_anfr"	TEXT,
	"nat_id"	INTEGER,
	"sup_nm_haut"	INTEGER,
	"tpo_id"	INTEGER,
	"adr_lb_lieu"	TEXT,
	"adr_lb_add1"	TEXT,
	"adr_lb_add2"	TEXT,
	"adr_lb_add3"	TEXT,
	"adr_nm_cp"	INTEGER,
	"com_cd_insee"	TEXT,
	"coordonnees"	TEXT,
	"coord"	TEXT,
	"en_service"	TEXT
);
DROP TABLE IF EXISTS "SUP_SUPPORT";
CREATE TABLE IF NOT EXISTS "SUP_SUPPORT" (
	"SUP_ID"	INTEGER,
	"STA_NM_ANFR"	TEXT,
	"NAT_ID"	INTEGER,
	"COR_NB_DG_LAT"	INTEGER,
	"COR_NB_MN_LAT"	INTEGER,
	"COR_NB_SC_LAT"	INTEGER,
	"COR_CD_NS_LAT"	TEXT,
	"COR_NB_DG_LON"	INTEGER,
	"COR_NB_MN_LON"	INTEGER,
	"COR_NB_SC_LON"	INTEGER,
	"COR_CD_EW_LON"	TEXT,
	"SUP_NM_HAUT"	INTEGER,
	"TPO_ID"	INTEGER,
	"ADR_LB_LIEU"	TEXT,
	"ADR_LB_ADD1"	TEXT,
	"ADR_LB_ADD2"	TEXT,
	"ADR_LB_ADD3"	TEXT,
	"ADR_NM_CP"	INTEGER,
	"COM_CD_INSEE"	TEXT
);
DROP TABLE IF EXISTS "SUP_STATION";
CREATE TABLE IF NOT EXISTS "SUP_STATION" (
	"STA_NM_ANFR"	TEXT,
	"ADM_ID"	INTEGER,
	"DEM_NM_COMSIS"	INTEGER,
	"DTE_IMPLANTATION"	TEXT,
	"DTE_MODIF"	TEXT,
	"DTE_EN_SERVICE"	TEXT
);
DROP TABLE IF EXISTS "SUP_EMETTEUR";
CREATE TABLE IF NOT EXISTS "SUP_EMETTEUR" (
	"EMR_ID"	INTEGER,
	"EMR_LB_SYSTEME"	TEXT,
	"STA_NM_ANFR"	TEXT,
	"AER_ID"	INTEGER,
	"EMR_DT_SERVICE"	TEXT
);
DROP TABLE IF EXISTS "SUP_BANDE";
CREATE TABLE IF NOT EXISTS "SUP_BANDE" (
	"STA_NM_ANFR"	TEXT,
	"BAN_ID"	INTEGER,
	"EMR_ID"	INTEGER,
	"BAN_NB_F_DEB"	TEXT,
	"BAN_NB_F_FIN"	TEXT,
	"BAN_FG_UNITE"	TEXT
);
DROP TABLE IF EXISTS "SUP_ANTENNE";
CREATE TABLE IF NOT EXISTS "SUP_ANTENNE" (
	"STA_NM_ANFR"	TEXT,
	"AER_ID"	INTEGER,
	"TAE_ID"	INTEGER,
	"AER_NB_DIMENSION"	TEXT,
	"AER_FG_RAYON"	TEXT,
	"AER_NB_AZIMUT"	TEXT,
	"AER_NB_ALT_BAS"	TEXT,
	"SUP_ID"	INTEGER
);
DROP TABLE IF EXISTS "SUP_TYPE_ANTENNE";
CREATE TABLE IF NOT EXISTS "SUP_TYPE_ANTENNE" (
	"TAE_ID"	INTEGER,
	"TAE_LB"	TEXT
);
DROP TABLE IF EXISTS "SUP_PROPRIETAIRE";
CREATE TABLE IF NOT EXISTS "SUP_PROPRIETAIRE" (
	"TPO_ID"	INTEGER,
	"TPO_LB"	TEXT
);
DROP TABLE IF EXISTS "SUP_NATURE";
CREATE TABLE IF NOT EXISTS "SUP_NATURE" (
	"NAT_ID"	INTEGER,
	"NAT_LB_NOM"	TEXT
);
DROP TABLE IF EXISTS "SUP_EXPLOITANT";
CREATE TABLE IF NOT EXISTS "SUP_EXPLOITANT" (
	"ADM_ID"	INTEGER,
	"ADM_LB_NOM"	TEXT
);
DROP INDEX IF EXISTS "sta_sup";
CREATE INDEX IF NOT EXISTS "sta_sup" ON "SUP_SUPPORT" (
	"STA_NM_ANFR"
);
DROP INDEX IF EXISTS "sta_sta";
CREATE INDEX IF NOT EXISTS "sta_sta" ON "SUP_STATION" (
	"STA_NM_ANFR"
);
DROP INDEX IF EXISTS "sta_em";
CREATE INDEX IF NOT EXISTS "sta_em" ON "SUP_EMETTEUR" (
	"STA_NM_ANFR"
);
DROP INDEX IF EXISTS "sta_ant";
CREATE INDEX IF NOT EXISTS "sta_ant" ON "SUP_ANTENNE" (
	"STA_NM_ANFR"
);
COMMIT;