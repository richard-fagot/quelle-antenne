import requests

resp = requests.get('https://wxs.ign.fr/choisirgeoportail/alti/rest/elevation.json?lon=0.2367|2.1570&lat=48.0551|46.6077&zonly=true')
if resp.status_code != 200:
    # This means something went wrong.
    raise ApiError('GET /tasks/ {}'.format(resp.status_code))
print(resp.json())
