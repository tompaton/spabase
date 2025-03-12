// Persistence management

import { createDeferred, Show } from "solid-js";

class AppSync {
    constructor(state, setState, key) {
        this.state = state;
        this.setState = (...args) => { console.log('setState', args); setState.apply(null, args); };
        this.key = key;

        this.initSave();
        this.bindEvents();
        this.syncing = false;
    }

    initSave() {
        // load state
        if (localStorage[this.key]) {
            console.log('loading...');
            this.setState(JSON.parse(localStorage[this.key]));
        }

        // save state when it changes
        createDeferred(() => {
            console.log('saving...');
            localStorage[this.key] = JSON.stringify(this.state);

            // save state to server if sync enabled
            if (this.syncEnabled()) {
                // TODO: only if it wasn't a ui/sync change
                this.syncServerState(true);
            }
        });
    }

    bindEvents() {
        // capture and remove previous event listener if any, otherwise vite will keep
        // adding new ones each time the code is reloaded
        if (document._visibilitychangeeventlistener !== undefined) {
            document.removeEventListener('visibilitychange', document._visibilitychangeeventlistener);
        }
        const listener = this.handleVisibilitychange.bind(this);
        document.addEventListener('visibilitychange', listener);
        document._visibilitychangeeventlistener = listener;

        // enable timer polling for changes
        console.log('enable timer...');
        this.poll_timer = window.setInterval(this.handleTimer.bind(this), 5000);
    }

    handleVisibilitychange() {
        console.log('visibilitychange...', document.visibilityState);
        if (document.visibilityState === 'visible') {
            // enable timer polling for changes
            console.log('enable timer...');
            this.poll_timer = window.setInterval(this.handleTimer.bind(this), 5000);

            // check for changes when user returns to the page
            if (this.syncEnabled())
                this.syncServerState();
        } else {
            // disable timer polling for changes
            console.log('clearing timer...');
            window.clearInterval(this.poll_timer);
        }
    }

    handleTimer() {
        console.log('timer...');
        if (this.syncEnabled())
            this.syncServerState();
    }

    syncEnabled() {
        return this.state.sync?.url;
    }

    generateRandomSyncUrl() {
        // random string to uniquely identify this device
        this.setState('sync', 'url',
            `https://${this.key}.tompaton.com/saved/`
            + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2));
    }

    getStateJSON() {
        // deep copy
        const backup = JSON.parse(JSON.stringify(this.state));

        // remove ui/device state
        delete backup.ui;
        delete backup.sync;

        return JSON.stringify(backup);
    }

    syncServerState(writing) {
        if (this.syncing) return;

        this.syncing = true;

        console.log('syncing...');

        // if writing is false, we're just checking for updates from another
        // device, writing back the merged changes if any.

        // if writing is true, we're updating the server with our latest state,
        // but first we have to check for updates and merge.

        // GET using If-Modified-Since header which will return nothing if it
        // hasn't changed
        const config = {
            method: 'GET',
            credentials: 'include',
            mode: 'cors',
            headers: {}
        };
        if (this.state.sync.date)
            config.headers['If-Modified-Since'] = this.state.sync.date;

        fetch(this.state.sync.url, config)
            .then(response => {
                if (response.status === 200) {
                    console.log('Updated');
                    this.setState('sync', 'date', response.headers.get("Last-Modified"));
                    return response.json();
                }
                // status 304 --> no update
                if (response.status === 304) {
                    console.log('No update');
                    return;
                }
                // status 404 --> create
                if (response.status === 404) {
                    console.log('Not found');
                    return;
                }
                // other status --> error
                console.error('Error: ' + response.status);
            }
            )
            .then(
                data => {
                    if (data) {
                        console.log('Loaded');
                        this.setState(data);
                        writing = true;
                    }

                    if (writing) {
                        const config = {
                            method: 'PUT',
                            credentials: 'include',
                            mode: 'cors',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: this.getStateJSON()
                        };
                        fetch(this.state.sync.url, config)
                            .then(response => {
                                console.log('Saved:' + response.status);
                                if (response.status === 201 || response.status === 204) {
                                    this.setState('sync', 'date', response.headers.get("Date"));
                                }
                                this.syncing = false;
                            });
                    } else {
                        this.syncing = false;
                    }
                }
            );
    }
}

// Sync management UI

function SyncButton(props) {
    return (
        <>
            <button
                onclick={() => document.getElementById('sync_dialog').showModal()}
                title={props.sync.syncEnabled()
                    ? "Sync enabled (click for settings)"
                    : "Sync disabled (click for settings)"}>
                {props.sync.syncEnabled() ? "Synced" : "Not synced"}
            </button>
            <Show when={props.sync.syncEnabled()}>
                <button onclick={() => props.sync.syncServerState()} title="Refresh state from server">↻</button>
            </Show>
        </>
    );
}

function SyncSettings(props) {
    return (
        <dialog id="sync_dialog">
            <h2>Sync</h2>
            <p>
                Enter sync settings url to share data between devices: <br />
                (contact me to register for free, or provide your own WebDAV url)
            </p>
            <form method="dialog">
                <p>
                    <label for="sync_url">Sharing url</label>
                    <input id="sync_url" type="text" value={props.sync.state.sync?.url || ''}
                        onchange={(event) => props.sync.setState('sync', 'url', event.target.value)} />
                    <button onclick={(event) => { event.preventDefault(); props.sync.generateRandomSyncUrl() }}
                        title="Generate random sync url">new</button>
                </p>
                <button>Close</button>
            </form>
        </dialog>
    );
}

export { AppSync, SyncButton, SyncSettings };