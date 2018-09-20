#!/usr/bin/python
import subprocess
import jack
import time
import os
import re
import sys
import argparse
import time
import nclib
from database import Database

jack_start_process = None
opusdec_process = None
file2jack_process = None
guitarix_process = None
jack_capture_process = None
lame_process = None

audio_duration = None

def processFile(artifactId, preset, input_file, output_dir):
    try:
        input_converted_file = input_file + '.wav'
        output_wav_file = output_dir + '/output.wav'
        output_mp3_file = output_dir + '/output.mp3'

        # TODO is it still needed? maybe API should check for it?
        print("-> Checking if artifact is in database...")
        if not Database().get_artifact(artifactId):
            raise ValueError("-> Artifact not available...")

        print("-> Starting JACK server...")
        jack_start_process = subprocess.Popen("jack_control start", shell=True, stdout=subprocess.PIPE)
        jack_start_process.wait()
        if jack_start_process.returncode != 0:
            raise ValueError("Could not start JACK")

        print("-> Converting file to WAV...")
        ffmpeg_process = subprocess.Popen("ffmpeg -i '" + input_file + "' -c:v copy '" + input_converted_file + "'", shell=True, stdout=subprocess.PIPE)
        ffmpeg_process.wait()
        if ffmpeg_process.returncode != 0:
            raise ValueError("Could not convert file to WAV")

        print("-> Starting file2jack...")
        file2jack_process = subprocess.Popen("cd jack-file && ./file2jack -at 0 -i '" + input_converted_file + "'", shell=True, stdout=subprocess.PIPE)
        client = jack.Client('AudioProcessing')

        print("-> Starting Guitarix...")
        guitarix_process = subprocess.Popen("guitarix -N -p 7000", shell=True, stdout=subprocess.PIPE)
        time.sleep(1) # TODO instead of a fixed sleep, keep checking until guitarix port is ready
        nc = nclib.Netcat(('localhost', 7000), verbose=True)
        jsonrpc_msg = '{"jsonrpc":"2.0","method":"setpreset","params":["ma-' + str(artifactId) + '","' + preset + '"]}\n'
        nc.send(bytes(jsonrpc_msg, 'utf-8'))
        # TODO check return to guarantee it succeeded

        # Wait until both ports file2jack and guitarix ports are available
        print("Waiting for file2jack and guitarix ports setup..."),
        while True:
            time.sleep(0.25)
            ports = ''.join(str(p) for p in client.get_ports())
            if re.search("gx_head_amp", ports) and re.search("file2jack", ports):
                print("Ready!")
                break

        try:
            client.connect('file2jack:out00', 'gx_head_amp:in_0')
        except jack.JackError:
            pass # skip if connection already exists
        try:
            client.connect('file2jack:out01', 'gx_head_amp:in_0')
        except jack.JackError:
            pass
        try:
            client.connect('gx_head_fx:out_0', 'system:playback_1')
        except jack.JackError:
            pass
        try:
            client.connect('gx_head_fx:out_1', 'system:playback_2')
        except jack.JackError:
            pass

        print("-> Starting jack_capture...")
        jack_capture_process = subprocess.Popen("jack_capture -jf '" + output_wav_file + "'", shell=True, stdout=subprocess.PIPE)

        # Wait until both ports file2jack and guitarix ports are available
        print("Waiting for jack_capture port setup..."),
        while True:
            time.sleep(0.25)
            ports = ''.join(str(p) for p in client.get_ports())
            if re.search("jack_capture", ports):
                print("Ready!")
                break

        audio_duration = float(os.popen("soxi -D '" + input_converted_file + "'").readlines()[0])
        print("Audio duration:", audio_duration, "s")

        client.transport_frame = 0
        # set freewheel if it's not set
        if client.realtime:
            client.set_freewheel(True)
        client.transport_start()
        print("-> Start transport")
        while(True):
            time_elapsed = int(client.transport_frame) / client.samplerate
            if time_elapsed > audio_duration:
                print("-> Stop transport")
                client.transport_stop()
                break

        client.set_freewheel(False)

        print("-> Converting output to MP3...")
        lame_process = subprocess.Popen("lame -b 192 -h '" + output_wav_file + "' '" + output_mp3_file + "'", shell=True, stdout=subprocess.PIPE)
        lame_process.wait()

        os.remove(output_wav_file)

    except ValueError as err:
        print ("-> ERROR: ", err)

    finally:
        if jack_capture_process is not None:
            print("-> Stopping jack_capture...")
            jack_capture_process.terminate()

        if guitarix_process is not None:
            print("-> Stopping guitarix...")
            #guitarix_process.kill() # doesn't work
            os.system('pkill guitarix')

        if file2jack_process is not None:
            print("-> Stopping File2jack...")
            #file2jack_process.kill() # doesn't work
            #os.system('pkill -TERM -P {pid}'.format(pid=file2jack_process.pid)) # doesn't work too
            os.system('pkill file2jack')

        if jack_start_process is not None:
            print("-> Stopping JACK server...")
            jack_stop_process = subprocess.Popen("jack_control stop", shell=True, stdout=subprocess.PIPE)
            jack_stop_process.wait()

            if jack_stop_process.returncode != 0:
                print("-> ERROR stopping JACK. Please stop it manually")

def main(argv):
    parser = argparse.ArgumentParser()
    parser.add_argument('artifact_id', type=int,
                    help='Artifact ID')
    parser.add_argument('preset',
                    help='Preset name')
    parser.add_argument('inputfile',
                    help='Input file')
    parser.add_argument('outputdir',
                    help='Output directory')

    args = parser.parse_args()

    if not os.path.exists(args.inputfile):
        print("Input file does not exist")
        sys.exit(1)
    if not os.path.exists(args.outputdir):
        os.mkdir(args.outputdir)
        if not os.path.exists(args.outputdir):
            print("Output dir doesn't exist and could not be created")
            sys.exit(1)

    processFile(args.artifact_id, args.preset, args.inputfile, args.outputdir)

if __name__ == "__main__":
   main(sys.argv[1:])
