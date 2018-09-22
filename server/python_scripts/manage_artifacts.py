#!/usr/bin/python
import sys
import argparse
import requests
import json
import urllib.request
import urllib.parse
from pathlib import Path
from database import Database

"""
This script downloads and updates all guitarix artifacts.
It populates the database and generates the json file served by API.
"""

def download_artifact(id, loadedArtifact=None):
    try:
        print('Getting artifact ' + str(id) + ' details...')
        if loadedArtifact == None:
            url = "https://musical-artifacts.com/artifacts/" + str(id) + ".json"
            artifact = json.loads(requests.get(url).text)
        else:
            artifact = loadedArtifact

        print('Downloading artifact...')
        filename = str(Path.home()) + '/.config/guitarix/banks/ma-' + str(id) + '.gx'
        urllib.request.urlretrieve(artifact["file"], filename)

        print('Saving on database...')
        Database().upsert_artifact(id, artifact["name"], artifact["file_hash"], json.dumps(get_bank_presets(filename)))

        print('Done!')
    except:
        print("Unexpected error on download_artifact:", sys.exc_info()[0])

def get_bank_presets(filename):
    try:
        with open(filename, encoding='utf-8') as data_file:
            data = json.loads(data_file.read())
        # presets are the even elements, except the first (0)
        return [val for idx, val in enumerate(data[2:]) if idx % 2 == 0]
    except:
        print("Unexpected error on get_bank_presets:", sys.exc_info()[0])
        raise

def update_artifacts():
    try:
        print("Getting list of artifacts from musical-artifacts.com...")
        url = "https://musical-artifacts.com/artifacts.json?formats=gx"
        artifacts = json.loads(requests.get(url).text)

        list_kept = []
        list_downloaded = []
        list_updated = []

        print("Checking artifacts...")
        for artifact in artifacts:
            if artifact["id"] == 409:
                pass # TODO FIXME artifact 409 raises an exception because of it's 'nil' values on .gx file
            artifact_on_db = Database().get_artifact(artifact["id"])
            # TODO optimization: get all artifacts in only one sql query in the beginning
            if artifact_on_db:
                if artifact_on_db[0][3] != artifact["file_hash"]:
                    print("Updating artifact " + artifact["id"])
                    download_artifact(artifact["id"], artifact)
                    list_updated.append(artifact["id"])
                else:
                    list_kept.append(artifact["id"])
            else:
                print("Downloading artifact")
                download_artifact(artifact["id"], artifact)
                list_downloaded.append(artifact["id"])
                # TODO verify if it was downloaded.

        # TODO delete old artifacts using Database().delete_artifact()

        print(str(len(list_downloaded)) + " artifacts downloaded: ", end='');
        print(', '.join(map(str, list_downloaded)))
        print(str(len(list_updated)) + " artifacts updated: ", end='');
        print(', '.join(map(str, list_updated)))
        print(str(len(list_kept)) + " artifacts kept: ", end='');
        print(', '.join(map(str, list_kept)))

        generate_json()
    except:
        print("Unexpected error on update_artifacts:", sys.exc_info()[0])

def list_artifacts_db():
    print("### ARTIFACTS ON DATABASE:")

    for artifact in Database().get_all_artifacts():
        print(artifact)

def generate_json():
    try:
        print("Generating json file...")
        artifacts_on_db = Database().get_all_artifacts_for_json()
        all = [{'ma_id': a[0], 'name': a[1], 'presets': json.loads(a[2])} for a in artifacts_on_db]

        guitarix_json_path = os.path.dirname(os.path.abspath(__file__)) + '/../guitarix.json'
        with open(guitarix_json_path, 'w') as outfile:
            json.dump(all, outfile)
        print("Done")
    except:
        print("Unexpected error on generate_json:", sys.exc_info()[0])

def main(argv):
    parser = argparse.ArgumentParser()
    parser.add_argument('mode',
                    choices=['list', 'update', 'createdb'],
                    help='Mode (list or update)')

    args = parser.parse_args()

    if args.mode == "update":
        update_artifacts()
    elif args.mode == "createdb":
        Database().create_database()
    else:
        list_artifacts_db()

if __name__ == "__main__":
   main(sys.argv[1:])
