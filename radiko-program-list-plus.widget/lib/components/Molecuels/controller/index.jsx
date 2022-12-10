import { css, React } from 'uebersicht';
import * as Radiko    from '../../../radiko-program-list/components';
import * as Vlc       from '../../../vlc-controller/components';

const Controller = ({
	className,
	style,
    playlist,
    playing,
    volume,
    onChangeChannel,
    onClickPlay,
    onClickStop,
    onClickVolumeUp,
    onClickVolumeDown,
	onClickMinimize,
	onClickMaximize,
	onClickReload,
}) => {
	const frame   = {
		padding:      '0.3em',
		margin:       '0.3em',
		borderRadius: '0.2em',
		background:   'rgba(51,49,50,.9)',
	};

	const icon    = {
		width:         '1.2em',
		height:        'auto',
		verticalAlign: 'middle',
		fill:          'rgba(230,230,230,.8)',
		filter:        'drop-shadow(0 0 0.5em #00BFFF)',
		userSelect:    'none',
		cursor:        'pointer',
	};

    const options = playlist.map(
        (item) => {
            return (
                <option
                    key   = { item.id }
                    value = { item.id }
                >
                    { item.name }
                </option>
            );
        }
    );

    return (
		<Radiko.Atoms.Row
			className = { `${ className ? className : '' } ${baseStyle(style)}`.trim() }
		>
            <Radiko.Atoms.Row
                style = {{
                    ...frame,
                    alignItems: 'center',
                    flexGrow:   '9',
                }}
            >
                <select
                    className = { `${selectStyle()}` }
                    value     = { playing }
                    onChange  = { onChangeChannel }
                >
                    { options }
                </select>
                {( onClickPlay ) ? (
                    <React.Fragment>
                        <Vlc.Atoms.Button.Play
                            className = { `${operationStyle()}` }
                            onClick   = { onClickPlay }
                        />
                    </React.Fragment>
                ) : (
                    <React.Fragment>
                        <Vlc.Atoms.Button.Stop
                            className = { `${operationStyle()}` }
                            onClick   = { onClickStop }
                        />
                    </React.Fragment>
                )}
                <Radiko.Atoms.Row
                    style = {{
                        alignItems: 'center'
                    }}
    			>
                    <Vlc.Atoms.Button.VolumeUp
                            className = { `${operationStyle()}` }
                            onClick = { onClickVolumeUp }
                    />
                    <Vlc.Atoms.Button.VolumeDown
                            className = { `${operationStyle()}` }
                            onClick = { onClickVolumeDown }
                    />
                    <Vlc.Atoms.Display
                        className = { `${screen()}` }
                    >
                        { volume }
                    </Vlc.Atoms.Display>
                </Radiko.Atoms.Row>
            </Radiko.Atoms.Row>
			<Radiko.Atoms.Row
                style = {{
                    alignItems: 'center'
                }}
            >
				{( onClickMinimize ) ? (
					<React.Fragment>
						<div style = { frame }>
							<Radiko.Atoms.Icon.Minimize
								onClick = { onClickMinimize }
								style   = { icon }
							/>
						</div>
						<div style = { frame }>
							<Radiko.Atoms.Icon.Reload
								onClick = { onClickReload }
								style   = { icon }
							/>
						</div>
					</React.Fragment>
				) : (
					<React.Fragment>
						<div style = { frame }>
							<Radiko.Atoms.Icon.Maximize
								onClick = { onClickMaximize }
								style   = { icon }
							/>
						</div>
					</React.Fragment>
				)}
			</Radiko.Atoms.Row>
		</Radiko.Atoms.Row>
	);
}

const baseStyle = (style) => css`
	${style}
`;

const selectStyle = (style) => css`
    & {
        position:         relative;
        width:            100%;
        overflow:         hidden;
        color:            rgba(230,230,230,.8);
        text-shadow:      0 0 8em;
        outline:          none;
        background-color: initial !important;
    }
`;

const operationStyle = (style) => css`
    color:  rgba(230,230,230,.8) !important;
    margin: 0 0 0 0.5em !important;
`;

const screen = () => css`
    margin-left: 1em;

    & div.screen {
        font-size:   0.8em;
        min-height:  initial !important;
        line-height: initial !important;
        textAlign:   center;
    }
`;

export {
	Controller,
};
