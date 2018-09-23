#!/usr/bin/python
import sys
import argparse
import requests
import json
import os
import subprocess
import urllib.request
import urllib.parse
from pathlib import Path
from database import Database

"""
This script downloads and updates all guitarix artifacts.
It populates the database and generates the json file served by API.
"""

def download_guitarix_artifact(id, loadedArtifact=None):
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
        Database().upsert_artifact(id, artifact["name"], artifact["file_hash"], json.dumps(get_bank_presets(filename)), "gx")

        print('Done!')
    except:
        print("Unexpected error on download_guitarix_artifact:", sys.exc_info()[0])

def download_soundfont_artifact(id, loadedArtifact=None):
    try:
        print('Getting artifact ' + str(id) + ' details...')
        if loadedArtifact == None:
            url = "https://musical-artifacts.com/artifacts/" + str(id) + ".json"
            artifact = json.loads(requests.get(url).text)
        else:
            artifact = loadedArtifact

        print('Downloading artifact...')
        filename = os.path.dirname(os.path.abspath(__file__)) + '/../soundfonts/' + str(id) + '.sf2'
        urllib.request.urlretrieve(artifact["file"], filename)

        print('Generating soundfonts...')
        #print("ruby '" + os.path.dirname(os.path.abspath(__file__)) + "/soundfont_builder.rb' '" + filename + "' " + str(id))
        soundfont_generator_process = subprocess.Popen("ruby '" + os.path.dirname(os.path.abspath(__file__)) + "/soundfont_builder.rb' '" + filename + "' " + str(id), shell=True, stderr=subprocess.PIPE, stdout=subprocess.PIPE, bufsize=0)
        stdout = soundfont_generator_process.communicate()[0]
        soundfont_generator_process.wait()
        assert soundfont_generator_process.returncode == 0

        print('Saving on database...')
        Database().upsert_artifact(id, artifact["name"], artifact["file_hash"], "", "sf2")

        print('Done!')
    except:
        print("Unexpected error on download_soundfont_artifact:", sys.exc_info()[0])

def get_bank_presets(filename):
    try:
        with open(filename, encoding='utf-8') as data_file:
            data = json.loads(data_file.read())
        # presets are the even elements, except the first (0)
        return [val for idx, val in enumerate(data[2:]) if idx % 2 == 0]
    except:
        print("Unexpected error on get_bank_presets:", sys.exc_info()[0])
        raise

# TODO Functions for updating guitarix and soundfont artifacts are very similar.
def update_guitarix_artifacts():
    try:
        print("Getting list of Guitarix artifacts from musical-artifacts.com...")
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
                    download_guitarix_artifact(artifact["id"], artifact)
                    list_updated.append(artifact["id"])
                else:
                    list_kept.append(artifact["id"])
            else:
                print("Downloading artifact")
                download_guitarix_artifact(artifact["id"], artifact)
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
        print("Unexpected error on update_guitarix_artifacts:", sys.exc_info()[0])

def update_soundfonts_artifacts():
    try:
        print("Getting list of Soundfont artifacts from musical-artifacts.com...")
        url = "https://musical-artifacts.com/artifacts.json?formats=sf2"
        artifacts = json.loads(requests.get(url).text)

        list_kept = []
        list_downloaded = []
        list_updated = []

        print("Checking artifacts...")
        for artifact in artifacts:
            artifact_on_db = Database().get_artifact(artifact["id"])
            # TODO optimization: get all artifacts in only one sql query in the beginning
            if artifact_on_db:
                if artifact_on_db[0][3] != artifact["file_hash"]:
                    print("Updating artifact " + artifact["id"])
                    download_soundfont_artifact(artifact["id"], artifact)
                    list_updated.append(artifact["id"])
                else:
                    list_kept.append(artifact["id"])
            else:
                print("Downloading artifact")
                download_soundfont_artifact(artifact["id"], artifact)
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
        print("Unexpected error on update_soundfonts_artifacts:", sys.exc_info()[0])

def list_artifacts_db():
    print("### ARTIFACTS ON DATABASE:")

    print("Guitarix artifacts:")
    for artifact in Database().get_all_artifacts("gx"):
        print(artifact)
    print("Soundfont artifacts:")

    for artifact in Database().get_all_artifacts("sf2"):
        print(artifact)

def generate_json():
    try:
        print("Generating Guitarix json file...")
        artifacts_on_db = Database().get_all_artifacts_for_json("gx")
        all = [{'ma_id': a[0], 'name': a[1], 'presets': json.loads(a[2])} for a in artifacts_on_db]

        guitarix_json_path = os.path.dirname(os.path.abspath(__file__)) + '/../guitarix.json'
        with open(guitarix_json_path, 'w') as outfile:
            json.dump(all, outfile)

        print("Generating Soundfonts json file...")
        artifacts_on_db = Database().get_all_artifacts_for_json("sf2")
        all = [{'ma_id': a[0], 'name': a[1]} for a in artifacts_on_db]

        soundfonts_json_path = os.path.dirname(os.path.abspath(__file__)) + '/../soundfonts.json'
        with open(soundfonts_json_path, 'w') as outfile:
            json.dump(all, outfile)
        print("Done")
    except:
        print("Unexpected error on generate_json:", sys.exc_info()[0])

def main(argv):
    parser = argparse.ArgumentParser()
    parser.add_argument('mode',
                    choices=['list', 'update_guitarix', 'update_soundfonts', 'createdb'],
                    help='Mode (list, update_guitarix, update_soundfonts or createdb)')

    args = parser.parse_args()

    if args.mode == "update_guitarix":
        update_guitarix_artifacts()
    elif args.mode == "update_soundfonts":
        update_soundfonts_artifacts()
    elif args.mode == "createdb":
        Database().create_database()
    else:
        list_artifacts_db()

if __name__ == "__main__":
   main(sys.argv[1:])
