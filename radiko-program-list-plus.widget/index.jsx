import { run, styled, React } from 'uebersicht';
import { radiko, striptags  } from './lib/radiko-program-list/libraries.bundle';
import { vlc }                from './lib/vlc-controller/libraries.bundle';
import * as Components        from './lib/components';
import * as Radiko            from './lib/radiko-program-list/components';

export const className        = `
	top:  0em;
	left: 0em;

	@keyframes marquee {
		from   { left: 100%; transform: translate(0%); }
		99%,to { left: 0%;   transform: translate(-100%); }
	}
`;

const Stations                = styled('div')(props => ({
	maxHeight:     '58.5vh',

	flexDirection: 'column',
	width:         '30em',
	overflowY:     'scroll',
	overflowX:     'hidden',
}));

const server                  = 'http://localhost:9090';
const user                    = '';
const password                = '';

const auth                    = (() => {
	if (!user && !password) {
		return '';
	}

	const option = [];

	if ('string' === typeof(user)) {
		option.push(user);
	}

	if ('string' === typeof(password)) {
		option.push(0 < option.length ? `:${password}` : password);
	}

	return ` -u '${option.join('')}'`
})();

const refreshInterval         = 30;

const DESCRIPTION             = {
	radio:       'ラジオ局',
	program:     '放送情報',
	start:       '開始時間',
	description: '概要',
}

const COMMANDS                = {
	GET_PROGRAM:  `curl -sS -L https://radiko.jp/v3/program/now/JP13.xml`,
	GET_PLAYLIST: `curl -sS -L '${server}/requests/playlist.xml'${auth}`,
	GET_STATUS:   `curl -sS -L '${server}/requests/status.xml'${auth}`,
	PLAY:         `curl -sS -L '${server}/requests/status.xml?command=pl_play&id=<id>'${auth}`,
	STOP:         `curl -sS -L '${server}/requests/status.xml?command=pl_stop'${auth}`,
	VOLUME:       `curl -sS -L '${server}/requests/status.xml?command=volume&val=<value>'${auth}`,
};

const STATUS                  = {
	STARTUP:  'RPL/STARTUP',
	MINIMIZE: 'RPL/MINIMIZE',
	MAXIMIZE: 'RPL/MAXIMIZE',
};

const STATES                  = {
	PLAYING: 'playing',
	STOPPED: 'stopped',
};

const VOLUME                  = {
	MAX: 300,
	MIN: 0,
}

export const command          = undefined;

export const refreshFrequency = false;

export const initialState     = { type: STATUS.STARTUP };

export const init             = (dispatch) => {
	updatePlaylist(dispatch);
	updateStatus(dispatch);
	updateProgram(dispatch);

	setTimeout(
		() => {
			updateProgram(dispatch);
			setInterval(
				() => {
					updateProgram(dispatch);
				},
				refreshInterval * (60 * 1000)
			);
		},
		nextRefreshTime()
	);
}

export const updateState      = (event, previousState) => {
	if (event.error) {
		return { ...previousState, warning: `We got an error: ${event.error}` };
	}

	return { ...previousState, ...event };
}

export const render           = (props, dispatch) => {
	const current = props.volume ? props.volume : 0;

	return (
		<div
			style = {{ width: '30em' }}
		>
			<Components.Molecuels.Controller
				playlist        = { props.playlist ? props.playlist : [] }
				playing         = { props.playing  ? props.playing  : -1 }
				volume          = { current }
				onChangeChannel = {(event) => { play(event.target.value, dispatch); }}
				onClickPlay     = { STATES.STOPPED === props.state ? () => { play(props.playing, dispatch); } : undefined }
				onClickStop     = { STATES.PLAYING === props.state ? () => { stop(dispatch); }                : undefined }
				onClickVolumeUp = {() => {
					if (VOLUME.MAX <= current + 10) { volume(dispatch, VOLUME.MAX); } else { volume(dispatch, current + 10) };
				}}
				onClickVolumeDown = {() => {
					if (VOLUME.MIN >= current - 10) { volume(dispatch, VOLUME.MIN); } else { volume(dispatch, current - 10) };
				}}
				onClickMinimize = { STATUS.MINIMIZE !== props.type ? (() => dispatch({ type: STATUS.MINIMIZE })) : undefined }
				onClickMaximize = { STATUS.MINIMIZE === props.type ? (() => dispatch({ type: STATUS.MAXIMIZE })) : undefined }
				onClickReload   = {() => { init(dispatch); }}
			/>
			<Stations
				style = {{
					display: STATUS.MINIMIZE === props.type ? 'none' : 'flex'
				}}
			>
				{ props.program }
			</Stations>
		</div>
	);
}

function nextRefreshTime() {
	const now           = new Date();
	const remainSeconds = 60 - now.getSeconds();
	const remainMinutes = now.getMinutes() % refreshInterval;

	const seconds       = remainSeconds;
	const minutes       = 0 === remainMinutes ? refreshInterval : refreshInterval - remainMinutes;

	if (60 === seconds) {
		return minutes * 60 * 1000;
	} else {
		return ((minutes -1) * 60 * 1000) + (seconds * 1000);
	}
}

function updateProgram(dispatch) {
	run(
		COMMANDS.GET_PROGRAM
	).then(
		(output) => {
			dispatch({ program: assembly(radiko.analysis(output)) });
		}
	).catch(
		(error) => {
			dispatch({ error: error });
		}
	);
}

function assembly(data) {
	const stations = [];

	Object.keys(data).forEach(
		(station) => {
			const programs = [];

			programs.push(
				<Radiko.Molecuels.Program
					key         = {data[station][0].title}
					logo        = {{ src: data[station][0].img }}
					program     = {{ description: DESCRIPTION.program,     text: `${data[station][0].title} ${data[station][0].pfm}` }}
					start       = {{ description: DESCRIPTION.start,       text: `${data[station][0].time.slice(0,2)}:${data[station][0].time.slice(2,4)}` }}
					description = {{ description: DESCRIPTION.description, text: `${striptags(data[station][0].info)}` }}
				/>
			);

			stations.push(
				<Radiko.Molecuels.Station
					key         = { station }
					description = { DESCRIPTION.radio }
					name        = { station }
				
				>
					{ programs }
				</Radiko.Molecuels.Station>
			);
		}
	);

	return stations;
}

function updatePlaylist(dispatch) {
	run(
		COMMANDS.GET_PLAYLIST
	).then(
		(output) => {
			const [playlist, media, playing] = vlc.playlist(output);
			let   playingId                  = -1;

			playlist.some((item) => {
				if (playing === item.name) {
					playingId = item.id;
				}
			});

			dispatch({ playlist: playlist, playing: playingId });
		}
	).catch(
		(error) => {
			dispatch({ error: error });
		}
	);
}

function updateStatus(dispatch) {
	run(
		COMMANDS.GET_STATUS
	).then(
		(output) => {
			dispatch({ ...vlc.status(output) });
		}
	).catch(
		(error) => {
			dispatch({ error: error });
		}
	);
}

function play(playing, dispatch) {
	run(
		COMMANDS.PLAY.replace('<id>', playing)
	).then(
		(output) => {
			dispatch({ playing: playing, ...vlc.status(output), state: STATES.PLAYING });
		}
	).catch(
		(error) => {
			dispatch({ error: error });
		}
	);
}

function stop(dispatch) {
	run(
		COMMANDS.STOP
	).then(
		(output) => {
			dispatch({ ...vlc.status(output), state: STATES.STOPPED });
		}
	).catch(
		(error) => {
			dispatch({ error: error });
		}
	);
}

function volume(dispatch, value) {
	run(
		COMMANDS.VOLUME.replace('<value>', value)
	).then(
		(output) => {
			dispatch({ ...vlc.status(output), volume: value });
		}
	).catch(
		(error) => {
			dispatch({ error: error });
		}
	);
}
