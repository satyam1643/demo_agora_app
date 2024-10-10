import React, { useRef, useState, useEffect } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { PermissionsAndroid, Platform } from 'react-native';
import {
    createAgoraRtcEngine,
    ChannelProfileType,
    ClientRoleType,
    IRtcEngine,
    RtcConnection,
    IRtcEngineEventHandler,
} from 'react-native-agora';

const appId = '523417bd7bec4fe1a3dc4829f9f02376';
const channelName = 'demochannel';
const uid = 0;

const App = () => {
    const agoraEngineRef = useRef<IRtcEngine>();
    const [isJoined, setIsJoined] = useState(false);
    const [remoteUid, setRemoteUid] = useState(0);
    const [message, setMessage] = useState('');
    const eventHandler = useRef<IRtcEngineEventHandler>();

    useEffect(() => {
        setupVideoSDKEngine();
        return () => {
            if (agoraEngineRef.current) {
                if (eventHandler.current) {
                    agoraEngineRef.current.unregisterEventHandler(eventHandler.current);
                }
                agoraEngineRef.current.release();
            }
        };
    }, []);

    const getPermission = async () => {
        if (Platform.OS === 'android') {
            await PermissionsAndroid.requestMultiple([
                PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            ]);
        }
    };

    const setupVideoSDKEngine = async () => {
        try {
            if (Platform.OS === 'android') {
                await getPermission();
            }
            agoraEngineRef.current = createAgoraRtcEngine();
            const agoraEngine = agoraEngineRef.current;
            eventHandler.current = {
                onJoinChannelSuccess: () => {
                    showMessage('Successfully joined channel: ' + channelName);
                    setIsJoined(true);
                },
                onUserJoined: (_connection: RtcConnection, remoteUid: number) => {
                    showMessage('Remote user ' + remoteUid + ' joined');
                    setRemoteUid(remoteUid);
                },
                onUserOffline: (_connection: RtcConnection, remoteUid: number) => {
                    showMessage('Remote user ' + remoteUid + ' left the channel');
                    setRemoteUid(0);
                },
            };

            agoraEngine.registerEventHandler(eventHandler.current);
            agoraEngine.initialize({
                appId: appId,
            });
        } catch (e) {
            showMessage('Error setting up Agora engine: ' + e);
        }
    };

    const join = async () => {
        if (isJoined) {
            return;
        }
        try {
            agoraEngineRef.current?.joinChannel('', channelName, uid, {
                channelProfile: ChannelProfileType.ChannelProfileCommunication,
                clientRoleType: ClientRoleType.ClientRoleBroadcaster,
                publishMicrophoneTrack: true,
                autoSubscribeAudio: true,
            });
        } catch (e) {
            showMessage('Error joining channel: ' + e);
        }
    };

    const leave = () => {
        try {
            agoraEngineRef.current?.leaveChannel();
            setRemoteUid(0);
            setIsJoined(false);
            showMessage('Left the channel');
        } catch (e) {
            showMessage('Error leaving channel: ' + e);
        }
    };

    const showMessage = (msg: string) => {
        setMessage(msg);
        console.log(msg); // For debugging
        Alert.alert('Message', msg); // Display to user
    };

    return (
        <SafeAreaView style={styles.main}>
            <Text style={styles.head}>Agora Voice Calling Quickstart</Text>
            <View style={styles.btnContainer}>
                <TouchableOpacity onPress={join} style={styles.button}>
                    <Text style={styles.buttonText}>Join Channel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={leave} style={styles.button}>
                    <Text style={styles.buttonText}>Leave Channel</Text>
                </TouchableOpacity>
            </View>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContainer}>
                {isJoined ? (
                    <Text style={{color:"black"}}>Local user uid: {uid}</Text>
                ) : (
                    <Text style={{color:"black"}}>Join a channel</Text>
                )}
                {isJoined && remoteUid !== 0 ? (
                    <Text style={{color:"black"}}>Remote user uid: {remoteUid}</Text>
                ) : (
                    <Text style={{color:"black"}}>Waiting for remote user to join</Text>
                )}
                <Text style={{color:"black"}}>{message}</Text>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    button: {
        paddingHorizontal: 25,
        paddingVertical: 4,
        backgroundColor: '#0055cc',
        margin: 5,
        borderRadius: 4,
    },
    buttonText: {
        fontWeight: 'bold',
        color: 'white',
    },
    main: { flex: 1, alignItems: 'center' },
    scroll: { flex: 1, backgroundColor: '#ddeeff', width: '100%' },
    scrollContainer: { alignItems: 'center' },
    btnContainer: { flexDirection: 'row', justifyContent: 'center' },
    head: { fontSize: 20, marginVertical: 10 },
});

export default App;