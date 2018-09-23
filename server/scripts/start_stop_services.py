#!/usr/bin/python
import subprocess
import os
import sys
import argparse

def start_services():
    try:
        print("-> Starting JACK server...")
        jack_start_process = subprocess.Popen("jack_control start", shell=True, stdout=subprocess.PIPE)
        jack_start_process.wait()
        if jack_start_process.returncode != 0:
            raise ValueError("Could not start JACK")

        print("-> Starting Guitarix...")
        subprocess.Popen(['guitarix', '-N', '-p', '7000'], close_fds=True)
    except ValueError as err:
        print ("-> ERROR: ", err)
    except:
        print("Unexpected error on start_services:", sys.exc_info()[0])

def stop_services():
    try:
        print("-> Stopping Guitarix...")
        os.system('pkill guitarix')

        print("-> Stopping JACK server...")
        jack_stop_process = subprocess.Popen("jack_control stop", shell=True, stdout=subprocess.PIPE)
        jack_stop_process.wait()

        if jack_stop_process.returncode != 0:
            print("-> ERROR stopping JACK. Please stop it manually")
    except ValueError as err:
        print ("-> ERROR: ", err)
    except:
        print("Unexpected error on stop_services:", sys.exc_info()[0])

def main(argv):
    parser = argparse.ArgumentParser()
    parser.add_argument('action',
                    help='Action (start|stop)',
                    choices=['start','stop'])

    args = parser.parse_args()

    if args.action == "start":
        start_services()
    elif args.action == "stop":
        stop_services()

if __name__ == "__main__":
   main(sys.argv[1:])
