import os
import json
from pathlib import Path
import sys
import sqlite3
import time
import datetime

class Database:
    database_file = os.path.dirname(os.path.abspath(__file__)) + '/database.db'

    def get_all_artifacts(self, filetype):
        try:
            conn = sqlite3.connect(self.database_file)
            cursor = conn.cursor()
            cursor.execute("""
            SELECT * FROM artifacts WHERE filetype=?
            """, (filetype,))

            results = cursor.fetchall()
            conn.close()

            return results
        except:
            print("Unexpected error on get_all_artifacts:", sys.exc_info()[0])
            raise

    def get_all_artifacts_for_json(self, filetype):
        try:
            conn = sqlite3.connect(self.database_file)
            cursor = conn.cursor()

            cursor.execute("""
            SELECT ma_id, name, options FROM artifacts WHERE filetype=?
            """, (filetype,))

            results = cursor.fetchall()
            conn.close()

            return results
        except:
            print("Unexpected error on get_all_artifacts_for_json:", sys.exc_info()[0])
            raise


    def get_artifact(self, id):
        try:
            conn = sqlite3.connect(self.database_file)
            cursor = conn.cursor()
            cursor.execute("""
            SELECT * FROM artifacts WHERE ma_id=?
            """, (id,))

            results = cursor.fetchall()
            conn.close()

            return results
        except:
            print("Unexpected error on get_artifact:", sys.exc_info()[0])
            raise

    def upsert_artifact(self, id, name, file_hash, options, filetype):
        try:
            conn = sqlite3.connect(self.database_file)
            cursor = conn.cursor()

            if self.get_artifact(id):
                print("Updating...")
                cursor.execute("""
                UPDATE artifacts
                SET name = ?, file_hash = ?, options = ?, filetype = ?, updated_at = ?
                WHERE ma_id = ?
                """, (name, file_hash, options, filetype, datetime.datetime.now(), id))
            else:
                print("Inserting...")
                cursor.execute("""
                INSERT INTO artifacts (ma_id, name, file_hash, options, filetype, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """, (id, name, file_hash, options, filetype, datetime.datetime.now()))

            conn.commit()
            conn.close()
        except:
            print("Could not upsert artifact:", sys.exc_info()[0])
            raise

    def delete_artifact(self, id):
        try:
            conn = sqlite3.connect(self.database_file)
            cursor = conn.cursor()

            cursor.execute("""
            DELETE FROM artifacts
            WHERE ma_id = ?
            """, (id,))

            conn.commit()
            conn.close()
            print("Artifact deleted")
        except:
            print("Could not upsert artifact:", sys.exc_info()[0])
            raise


    def create_database(self):
        try:
            conn = sqlite3.connect(self.database_file)
            cursor = conn.cursor()

            cursor.execute("""
            CREATE TABLE artifacts (
                    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                    ma_id INTEGER NOT NULL,
                    name TEXT,
                    file_hash TEXT,
                    options TEXT,
                    filetype TEXT,
                    updated_at DATE NOT NULL
            );
            """)

            print("Database succesfully created.")

            conn.close()
            return True
        except:
            print("Could not create database table:", sys.exc_info()[0])
            return False
