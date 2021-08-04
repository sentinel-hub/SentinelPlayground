import React from 'react';
import Store from '../store';
import { htmlTemplate, mapTemplates } from './mustacheTemplates';
import ScriptPanel from './advanced/ScriptPanel';
import { getMapParameters } from '../utils/utils';

import CopyToClipboard from 'react-copy-to-clipboard';
import fileDownload from 'react-file-download';

import './DevCodeSnippets.scss';

export default class DevCodeSnippets extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      template: mapTemplates.LEAFLET,
      defaultText: 'copy',
      copiedText: 'copied',
      text: 'copy',
      flashed: true,
      tabIndex: 0,
      defaultApiButton: 'Apply',
      appliedButton: 'Applied',
      apiText: 'Apply',
      flashedApi: true,
      tempApiKeyState: null
    };
  }

  getDescription() {
    let currentState = getMapParameters(true, true);

    return (
      <div className="DevCodeSnippets_Description">
        <span>Used parameters:</span>
        <ul>
          {currentState.preset !== undefined && (
            <li>one of the predefined visualizations - {currentState.preset}</li>
          )}
          {currentState.layers !== undefined && <li>visualization using RGB bands</li>}
          {currentState.evalscript !== undefined && <li>visualization using custom script</li>}

          {currentState.atmFilter === '' && <li>without atmospheric correction</li>}
          {currentState.atmFilter !== '' && <li>with atmospeheric correction</li>}

          {currentState.showDates && <li>with showing dates on tiles</li>}
          {!currentState.showDates && <li>without showing dates on tiles</li>}

          {currentState.gain && <li>adapted with gain of {currentState.gain}</li>}
          {currentState.gamma && <li>adapted with gamma of {currentState.gamma}</li>}
        </ul>
      </div>
    );
  }

  handleMapLibraryClick = template => {
    const content = htmlTemplate(template, getMapParameters(true, true));
    this.cm.cm.codeMirror.setValue(content);
    this.setState({ template });
  };

  handleCodeCopy = () => {
    let duration = 2000;
    let { flashed, defaultText, copiedText } = this.state;

    if (!flashed) return;

    this.setState(function() {
      return {
        text: copiedText,
        flashed: false
      };
    });

    setTimeout(() => {
      this.setState(function() {
        return {
          text: defaultText,
          flashed: true
        };
      });
    }, duration);
  };

  handleGApiKeyUpAndChange = event => {
    let apiKey = event.target.value;
    const { tempGoogleMapsApiKey } = Store.current;

    if (apiKey !== tempGoogleMapsApiKey) Store.setTempGoogleMapsApiKey(apiKey);
  };

  applyTempGApiKey() {
    const { tempGoogleMapsApiKey, googleMapsApiKey } = Store.current;

    if (tempGoogleMapsApiKey === googleMapsApiKey) return;

    Store.setGoogleMapsApiKey(tempGoogleMapsApiKey);
  }

  handleTabsChange = tabIndex => {
    this.setState({ tabIndex });
  };

  handleApiKeyClick = () => {
    let duration = 2000;
    let { flashedApi, defaultApiButton, appliedButton } = this.state;

    if (!flashedApi) return;

    this.applyTempGApiKey();

    this.setState(function() {
      return {
        apiText: appliedButton,
        flashedApi: false
      };
    });

    setTimeout(() => {
      this.setState(function() {
        return {
          apiText: defaultApiButton,
          flashedApi: true
        };
      });
    }, duration);
  };

  executeFileDownload = () => {
    const { template } = this.state;

    let code = htmlTemplate(this.state.template, getMapParameters(true, true));
    let filename = `${template.id}-example.html`;

    fileDownload(code, filename);
  };

  componentDidMount() {
    if (this.cm) {
      setTimeout(() => {
        this.cm.cm.codeMirror.refresh();
      }, 300);
    }
  }

  render() {
    const { template, tempGoogleMapsApiKey, googleMapsApiKeyDefault, tabIndex } = this.state;
    const [, height] = Store.current.size;
    let contentHeight = height - 100 - 40 - 10;
    let codeEditorSize = height - 100 - 40 - 48;
    const content = htmlTemplate(template, getMapParameters(true, true));
    const previewContent = htmlTemplate(template, getMapParameters(true, true));
    return (
      <div className="DevCodeSnippets" id="DevCodeSnippets">
        <h2 className="DevCodeSnippets_Title" id="DevCodeSnippets_Title">
          Integrate Sentinel Hub in common web apps
        </h2>

        <div className="DevCodeSnippets_Content" style={{ height: contentHeight }}>
          <div className="DevCodeSnippets_Column Left">
            <div className="DevCodeSnippets_ColumnContent">
              {this.getDescription()}
              <br />
              Select the <i>maps</i> library and copy the code generated for the configured
              visualization.
              <ul className="DevCodeSnippets_Maps">
                {Object.keys(mapTemplates).map((key, i) => {
                  const temp = mapTemplates[key];
                  return (
                    <li
                      key={i}
                      className={temp.label === template.label ? 'active' : ''}
                      onClick={() => this.handleMapLibraryClick(temp)}
                    >
                      {temp.label}
                    </li>
                  );
                })}
              </ul>
              {false && (
                <div>
                  <br />
                  <h4 className="DevCodeSnippets_SubTitle api-key-input">
                    Enter your Google Maps API key
                  </h4>

                  <div className="DevCodeSnippets_ApiKeyGroup">
                    <div className="DevCodeSnippets_ApiKeyInputWrapper">
                      <input
                        className="DevCodeSnippets_ApiKeyInput"
                        type="text"
                        placeholder={googleMapsApiKeyDefault}
                        value={tempGoogleMapsApiKey}
                        onKeyUp={this.handleGApiKeyUpAndChange}
                        onChange={this.handleGApiKeyUpAndChange}
                        onFocus={this.handleApiKeyInputFocus}
                        onBlur={this.handleApiKeyInputBlur}
                      />
                    </div>
                    <button
                      type="submit"
                      className="DevCodeSnippets_ApiKeyButton"
                      onClick={this.handleApiKeyClick}
                    >
                      {this.state.apiText}
                    </button>
                  </div>

                  <div
                    className="notification"
                    style={{
                      textAlign: 'left',
                      marginLeft: '0',
                      marginTop: '0'
                    }}
                  >
                    <i className="fa fa-info" />
                    &nbsp; Your Google Maps code example won't work without a valid Google Maps API
                    key. Click{' '}
                    <a
                      href="https://developers.google.com/maps/documentation/javascript/get-api-key"
                      target="_blank"
                    >
                      here
                    </a>{' '}
                    for more informations.
                    <br />
                    <br />
                    Leaflet and OpenLayers examples are not affected by this.
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="DevCodeSnippets_Column Right">
            <div className="DevCodeSnippets_ColumnContent">
              <h4 className="DevCodeSnippets_SubTitle code-editor">
                Your code using <i>{template.label}</i> library
              </h4>

              <div className="DevCodeSnippets_sub700" />

              <div
                className={'DevCodeSnippets_ViewTabs' + (tabIndex === 0 ? ' active' : '')}
                onClick={() => this.handleTabsChange(0)}
              >
                code
              </div>

              <div
                className={'DevCodeSnippets_ViewTabs' + (tabIndex === 1 ? ' active' : '')}
                onClick={() => this.handleTabsChange(1)}
              >
                preview
              </div>

              <CopyToClipboard text={content} onCopy={this.handleCodeCopy}>
                <div
                  className="DevCodeSnippets_Options"
                  style={{ marginRight: '4px' }}
                  title="Copy to clipboard"
                >
                  {this.state.text}
                </div>
              </CopyToClipboard>

              <div
                className="DevCodeSnippets_Options"
                onClick={this.executeFileDownload}
                title="Download code"
              >
                download
              </div>

              <div style={{ clear: 'both' }} />

              {tabIndex === 0 ? (
                <ScriptPanel
                  ref={el => (this.cm = el)}
                  mode="htmlmixed"
                  disabled={true}
                  height={codeEditorSize + 'px'}
                  value={content}
                />
              ) : (
                <div className="DevCodeSnippets_Iframe">
                  <iframe
                    // srcDoc={previewContent}
                    style={{ width: '100%', border: 'none' }}
                    height={codeEditorSize - 5 + ''}
                    src={'data:text/html;charset=utf-8,' + encodeURIComponent(previewContent)}
                  />
                </div>
              )}
            </div>
          </div>

          <div style={{ clear: 'both' }} />
        </div>
      </div>
    );
  }
}
