/*
  The sqlite3 .import import the first line of imported files which is headers. So we delete it.
*/
delete from anfr where id = 'id';
delete from SUP_SUPPORT where STA_NM_ANFR = 'STA_NM_ANFR';
delete from SUP_STATION where STA_NM_ANFR = 'STA_NM_ANFR';
delete from SUP_EMETTEUR where STA_NM_ANFR = 'STA_NM_ANFR';
delete from SUP_BANDE where STA_NM_ANFR = 'STA_NM_ANFR';
delete from SUP_ANTENNE where STA_NM_ANFR = 'STA_NM_ANFR';
delete from SUP_TYPE_ANTENNE where TAE_LB = 'TAE_LB';
delete from SUP_PROPRIETAIRE where TPO_LB = 'TPO_LB';
delete from SUP_NATURE where NAT_ID = 'NAT_ID';
delete from SUP_EXPLOITANT where ADM_LB_NOM = 'ADM_LB_NOM';

/*
  Add latitude and longitude columns for convenience then compute their values.
*/
ALTER TABLE SUP_SUPPORT
  ADD lat REAL;
ALTER TABLE SUP_SUPPORT  
  ADD lon REAL;

update SUP_SUPPORT set lat = case 
   when SUP_SUPPORT.COR_CD_NS_LAT=="S" 
      then -1*(SUP_SUPPORT.COR_NB_DG_LAT+SUP_SUPPORT.COR_NB_MN_LAT/60.0+SUP_SUPPORT.COR_NB_SC_LAT/3600.0) 
      else (SUP_SUPPORT.COR_NB_DG_LAT+SUP_SUPPORT.COR_NB_MN_LAT/60.0+SUP_SUPPORT.COR_NB_SC_LAT/3600.0) 
   end;
   
update SUP_SUPPORT set lon = case 
   when SUP_SUPPORT.COR_CD_EW_LON=="W" 
      then -1*(SUP_SUPPORT.COR_NB_DG_LON+SUP_SUPPORT.COR_NB_MN_LON/60.0+SUP_SUPPORT.COR_NB_SC_LON/3600.0) 
      else (SUP_SUPPORT.COR_NB_DG_LON+SUP_SUPPORT.COR_NB_MN_LON/60.0+SUP_SUPPORT.COR_NB_SC_LON/3600.0) 
   end;

