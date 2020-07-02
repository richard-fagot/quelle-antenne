import requests
import zipfile
import os

DB_NAME = 'quelle-antenne.sqlite3'
UNZIP_DIR = './data/'
SQLITE_PATH = os.getenv('SQLITE_HOME')

def DLInstallRadioSup5W(url):
    """ Inspired by https://www.codementor.io/@aviaryan/downloading-files-from-urls-in-python-77q3bs0un

    Download a file from data.gouv.fr about radio installation with power higher than 5W.
    These contain 4G antenna relays.
    """
    # Get the filename
    h = requests.head(url, allow_redirects=False)
    header = h.headers
    location_url = header.get('location')
    filename = location_url.split('/')[-1]

    # DL file
    r = requests.get(url, allow_redirects=True)
    with open(filename, 'wb') as f:
        f.write(r.content)
    f.closed
    return filename

def unzipRadioData(zipName, destination):
    with zipfile.ZipFile(zipName, 'r') as zip_ref:
        zip_ref.extractall(destination)
    zip_ref.close()

def importRadioData(*args):
    for url in args:
        filename = DLInstallRadioSup5W(url)
        unzipRadioData(filename, UNZIP_DIR)
    
    os.system(SQLITE_PATH + ' -batch ' + DB_NAME + ' ".read ./script/create-quelle-antenne.sql"')

    files = filter(lambda file: file.endswith('.txt'), os.listdir(UNZIP_DIR))
    for file in files:
        convert2UTF8(file)
        tableName = file.split('.')[0]
        print('Import '+tableName)
        cmd = SQLITE_PATH + ' -csv -separator ";" -batch ' + DB_NAME + ' ".import ' + UNZIP_DIR + file + ' ' + tableName + '"'
        print(cmd)
        os.system(cmd) 

    os.system(SQLITE_PATH + ' -batch ' + DB_NAME + ' ".read ./script/remove-column-names.sql"')

def convert2UTF8(filename):
    srcfile = UNZIP_DIR+filename
    from_codec = 'iso-8859-1'
    trgfile = UNZIP_DIR+'tmp'

    try: 
        with open(srcfile, 'r', encoding=from_codec) as f, open(trgfile, 'w', encoding='utf-8') as e:
            text = f.read() # for small files, for big use chunks
            e.write(text)

        os.remove(srcfile) # remove old encoding file
        os.rename(trgfile, srcfile) # rename new encoding
    except UnicodeDecodeError:
        print('Decode Error')
    except UnicodeEncodeError:
        print('Encode Error')


ref_url = 'https://www.data.gouv.fr/en/datasets/r/06b0b54d-ff22-49e5-90e1-ee31872ff228'
data_url = 'https://www.data.gouv.fr/en/datasets/r/09298944-b4d5-4d19-a7e9-527183e1bf99'

if (not os.path.exists(UNZIP_DIR)):
    os.mkdir(UNZIP_DIR)

importRadioData(ref_url, data_url)




