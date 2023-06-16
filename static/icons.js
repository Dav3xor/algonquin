
var icons = {
    'arrow_up': `<svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="1.92em" 
                      fill="currentColor" class="bi bi-arrow-bar-up" viewBox="0 0 16 16">
                   <path fill-rule="evenodd" 
                         d="M8 10a.5.5 0 0 0 .5-.5V3.707l2.146 2.147a.5.5 0 0 0 
                         .708-.708l-3-3a.5.5 0 0 0-.708 0l-3 3a.5.5 0 1 0 
                         .708.708L7.5 3.707V9.5a.5.5 0 0 0 .5.5zm-7 2.5a.5.5 0 0 1 
                         .5-.5h13a.5.5 0 0 1 0 1h-13a.5.5 0 0 1-.5-.5z"/>
                 </svg>`,

    'arrow_down': `<svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="1.92em" 
                        fill="currentColor" class="bi bi-arrow-bar-down" viewBox="0 0 16 16">
                     <path fill-rule="evenodd" 
                           d="M1 3.5a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 0 1h-13a.5.5 0 0 
                           1-.5-.5zM8 6a.5.5 0 0 1 .5.5v5.793l2.146-2.147a.5.5 
                           0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 
                           .708-.708L7.5 12.293V6.5A.5.5 0 0 1 8 6z"/>
                   </svg>`,
    'audio':     `<svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="1.92em" 
                       fill="currentColor" class="bi bi-file-music" viewBox="0 0 16 16">
                  <path d="M10.304 3.13a1 1 0 0 1 1.196.98v1.8l-2.5.5v5.09c0 
                           .495-.301.883-.662 1.123C7.974 12.866 7.499 13 7 
                           13c-.5 0-.974-.134-1.338-.377-.36-.24-.662-.628-.662-1.123s.301-.883.662-1.123C6.026 
                           10.134 6.501 10 7 10c.356 0 .7.068 1 .196V4.41a1 1 0 0 1 .804-.98l1.5-.3z"/>
                  <path d="M4 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 
                           2-2V2a2 2 0 0 0-2-2H4zm0 1h8a1 1 0 0 1 1 1v12a1 
                           1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z"/>
                </svg>`,

    'archive':        `<svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="1.92em" 
                            fill="currentColor" class="bi bi-file-zip" viewBox="0 0 16 16">
                         <path d="M6.5 7.5a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v.938l.4 1.599a1 1 0 0 
                                  1-.416 1.074l-.93.62a1 1 0 0 1-1.109 0l-.93-.62a1 1 0 0 
                                  1-.415-1.074l.4-1.599V7.5zm2 0h-1v.938a1 1 0 0 1-.03.243l-.4 
                                  1.598.93.62.93-.62-.4-1.598a1 1 0 0 1-.03-.243V7.5z"/>
                         <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 
                                  1-2-2V2zm5.5-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 
                                  1-1V2a1 1 0 0 0-1-1H9v1H8v1h1v1H8v1h1v1H7.5V5h-1V4h1V3h-1V2h1V1z"/>
                       </svg>`,

    'binoculars':     `<svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="1.92em" 
                            fill="currentColor" class="bi bi-binoculars" viewBox="0 0 16 16">
                         <path d="M3 2.5A1.5 1.5 0 0 1 4.5 1h1A1.5 1.5 0 0 1 7 
                                  2.5V5h2V2.5A1.5 1.5 0 0 1 10.5 1h1A1.5 1.5 0 0 1 13 
                                  2.5v2.382a.5.5 0 0 0 .276.447l.895.447A1.5 1.5 0 0 1 15 
                                  7.118V14.5a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 
                                  14.5v-3a.5.5 0 0 1 .146-.354l.854-.853V9.5a.5.5 0 0 
                                  0-.5-.5h-3a.5.5 0 0 0-.5.5v.793l.854.853A.5.5 0 0 1 7 
                                  11.5v3A1.5 1.5 0 0 1 5.5 16h-3A1.5 1.5 0 0 1 1 
                                  14.5V7.118a1.5 1.5 0 0 1 .83-1.342l.894-.447A.5.5 0 0 0 3 
                                  4.882V2.5zM4.5 2a.5.5 0 0 0-.5.5V3h2v-.5a.5.5 0 0 
                                  0-.5-.5h-1zM6 4H4v.882a1.5 1.5 0 0 1-.83 1.342l-.894.447A.5.5 0 0 0 2 
                                  7.118V13h4v-1.293l-.854-.853A.5.5 0 0 1 5 10.5v-1A1.5 1.5 0 0 1 6.5 
                                  8h3A1.5 1.5 0 0 1 11 9.5v1a.5.5 0 0 1-.146.354l-.854.853V13h4V7.118a.5.5 0 0 
                                  0-.276-.447l-.895-.447A1.5 1.5 0 0 1 12 4.882V4h-2v1.5a.5.5 0 0 
                                  1-.5.5h-3a.5.5 0 0 1-.5-.5V4zm4-1h2v-.5a.5.5 0 0 
                                  0-.5-.5h-1a.5.5 0 0 0-.5.5V3zm4 11h-4v.5a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 
                                  .5-.5V14zm-8 0H2v.5a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5V14z"/>
                       </svg>`,

    'bell': `<svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="1.92em" 
                    fill="currentColor" class="bi bi-bell" viewBox="0 0 16 16">
                 <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 
                          4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 
                          1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 
                          8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 
                          12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 
                          6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 
                          0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z"/>
              </svg>`,

    'bug':         `<svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="1.92em" 
                         fill="currentColor" class="bi bi-bug" viewBox="0 0 16 16">
                      <path d="M4.355.522a.5.5 0 0 1 .623.333l.291.956A4.979 4.979 0 0 1 8 1c1.007 0 
                               1.946.298 2.731.811l.29-.956a.5.5 0 1 1 .957.29l-.41 1.352A4.985 4.985 
                               0 0 1 13 6h.5a.5.5 0 0 0 .5-.5V5a.5.5 0 0 1 1 0v.5A1.5 1.5 0 0 1 13.5 
                               7H13v1h1.5a.5.5 0 0 1 0 1H13v1h.5a1.5 1.5 0 0 1 1.5 1.5v.5a.5.5 0 1 1-1 
                               0v-.5a.5.5 0 0 0-.5-.5H13a5 5 0 0 1-10 0h-.5a.5.5 0 0 0-.5.5v.5a.5.5 
                               0 1 1-1 0v-.5A1.5 1.5 0 0 1 2.5 10H3V9H1.5a.5.5 0 0 1 0-1H3V7h-.5A1.5 
                               1.5 0 0 1 1 5.5V5a.5.5 0 0 1 1 0v.5a.5.5 0 0 0 .5.5H3c0-1.364.547-2.601 
                               1.432-3.503l-.41-1.352a.5.5 0 0 1 .333-.623zM4 7v4a4 4 0 0 0 3.5 
                               3.97V7H4zm4.5 0v7.97A4 4 0 0 0 12 11V7H8.5zM12 6a3.989 3.989 0 0 
                               0-1.334-2.982A3.983 3.983 0 0 0 8 2a3.983 3.983 0 0 0-2.667 1.018A3.989 
                               3.989 0 0 0 4 6h8z"/>
                    </svg>`,

    'chat_bubble': `<svg width="1.92em" height="1.92em" viewBox="0 0 16 16" class="bi bi-chat-text" 
                         fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path fill-rule="evenodd" 
                            d="M2.678 11.894a1 1 0 0 1 .287.801 10.97 10.97 0 0 1-.398 
                               2c1.395-.323 2.247-.697 2.634-.893a1 1 0 0 1 .71-.074A8.06 
                               8.06 0 0 0 8 14c3.996 0 7-2.807 7-6 0-3.192-3.004-6-7-6S1 
                               4.808 1 8c0 1.468.617 2.83 1.678 3.894zm-.493 3.905a21.682 
                               21.682 0 0 1-.713.129c-.2.032-.352-.176-.273-.362a9.68 9.68 
                               0 0 0 .244-.637l.003-.01c.248-.72.45-1.548.524-2.319C.743 
                               11.37 0 9.76 0 8c0-3.866 3.582-7 8-7s8 3.134 8 7-3.582 7-8 
                               7a9.06 9.06 0 0 1-2.347-.306c-.52.263-1.639.742-3.468 1.105z"/>
                      <path fill-rule="evenodd" 
                            d="M4 5.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zM4 
                               8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8zm0 
                               2.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5z"/>
                    </svg>`,

    'chat_bubble_small': `<svg width="1.00em" height="1.00em" viewBox="0 0 16 16" class="bi bi-chat-text" 
                               fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path fill-rule="evenodd" 
                                  d="M2.678 11.894a1 1 0 0 1 .287.801 10.97 10.97 0 0 1-.398 
                                     2c1.395-.323 2.247-.697 2.634-.893a1 1 0 0 1 .71-.074A8.06 
                                     8.06 0 0 0 8 14c3.996 0 7-2.807 7-6 0-3.192-3.004-6-7-6S1 
                                     4.808 1 8c0 1.468.617 2.83 1.678 3.894zm-.493 3.905a21.682 
                                     21.682 0 0 1-.713.129c-.2.032-.352-.176-.273-.362a9.68 9.68 
                                     0 0 0 .244-.637l.003-.01c.248-.72.45-1.548.524-2.319C.743 
                                     11.37 0 9.76 0 8c0-3.866 3.582-7 8-7s8 3.134 8 7-3.582 7-8 
                                     7a9.06 9.06 0 0 1-2.347-.306c-.52.263-1.639.742-3.468 1.105z"/>
                            <path fill-rule="evenodd" 
                                  d="M4 5.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zM4 
                                     8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8zm0 
                                     2.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5z"/>
                          </svg>`,
    
    'blank': `<svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="1.92em" 
                   fill="currentColor" class="bi bi-arrow-bar-up" viewBox="0 0 16 16">
              </svg>`,

    'card': `<svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="1.92em" 
                  fill="currentColor" class="bi bi-postcard" viewBox="0 0 16 16">
               <path fill-rule="evenodd" d="M2 2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 
                     2 0 0 0 2-2V4a2 2 0 0 0-2-2H2ZM1 4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 
                     1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4Zm7.5.5a.5.5 0 0 0-1 
                     0v7a.5.5 0 0 0 1 0v-7ZM2 5.5a.5.5 0 0 1 .5-.5H6a.5.5 0 0 1 0 
                     1H2.5a.5.5 0 0 1-.5-.5Zm0 2a.5.5 0 0 1 .5-.5H6a.5.5 0 0 1 0 
                     1H2.5a.5.5 0 0 1-.5-.5Zm0 2a.5.5 0 0 1 .5-.5H6a.5.5 0 0 1 0 
                     1H2.5a.5.5 0 0 1-.5-.5ZM10.5 5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 
                     .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3ZM13 8h-2V6h2v2Z"/>
             </svg>`,

    'download':     `<svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="1.92em" 
                          fill="currentColor" class="bi bi-cloud-download" viewBox="0 0 16 16">
                       <path d="M4.406 1.342A5.53 5.53 0 0 1 8 0c2.69 0 4.923 2 5.166 
                                4.579C14.758 4.804 16 6.137 16 7.773 16 9.569 14.502 11 
                                12.687 11H10a.5.5 0 0 1 0-1h2.688C13.979 10 15 8.988 15 
                                7.773c0-1.216-1.02-2.228-2.313-2.228h-.5v-.5C12.188 2.825 
                                10.328 1 8 1a4.53 4.53 0 0 0-2.941 1.1c-.757.652-1.153 
                                1.438-1.153 2.055v.448l-.445.049C2.064 4.805 1 5.952 1 
                                7.318 1 8.785 2.23 10 3.781 10H6a.5.5 0 0 1 0 1H3.781C1.708 
                                11 0 9.366 0 7.318c0-1.763 1.266-3.223 
                                2.942-3.593.143-.863.698-1.723 1.464-2.383z"/>
                       <path d="M7.646 15.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 
                                14.293V5.5a.5.5 0 0 0-1 0v8.793l-2.146-2.147a.5.5 0 0 0-.708.708l3 3z"/>
                     </svg>`,
    'dragon':`      <svg xmlns:dc="http://purl.org/dc/elements/1.1/"
                         xmlns:cc="http://creativecommons.org/ns#"
                         xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
                         xmlns:svg="http://www.w3.org/2000/svg"
                         xmlns="http://www.w3.org/2000/svg"
                         xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"
                         xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
                         width="420px" height="594px" viewBox="0 0 210 297"
                         version="1.1" id="svg11429"
                         inkscape:version="0.92.3 (2405546, 2018-03-11)" 
                         sodipodi:docname="dragon.svg">
                      <defs
                         id="defs11423" />
                      <sodipodi:namedview
                         id="base" pagecolor="#ffffff" bordercolor="#666666" borderopacity="1.0"
                         inkscape:pageopacity="0.0" inkscape:pageshadow="2" inkscape:zoom="0.98994949"
                         inkscape:cx="404.57449" inkscape:cy="512.12526" inkscape:document-units="mm"
                         inkscape:current-layer="layer1" showgrid="false" inkscape:window-width="1990"
                         inkscape:window-height="1285" inkscape:window-x="389" inkscape:window-y="355"
                         inkscape:window-maximized="0" />
                      <metadata
                         id="metadata11426">
                        <rdf:RDF>
                          <cc:Work
                             rdf:about="">
                            <dc:format>image/svg+xml</dc:format>
                            <dc:type
                               rdf:resource="http://purl.org/dc/dcmitype/StillImage" />
                            <dc:title></dc:title>
                          </cc:Work>
                        </rdf:RDF>
                      </metadata>
                      <g
                         inkscape:label="Layer 1"
                         inkscape:groupmode="layer"
                         id="layer1">
                        <path
                           style="fill:#dc6565;fill-opacity:1;stroke:#000000;stroke-width:0.26458332px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"
                           d="m 19.807745,163.60137 c -7.653012,-35.22756 15.817206,-42.08479 12.710656,-48.32724 -3.070968,-6.17095 -14.967644,1.03432 -16.691136,-6.86988 -1.651133,-7.57233 10.071065,-7.27048 7.315055,-10.972261 -1.314005,-1.764928 -5.589086,-0.600595 -6.229764,0.852925 -0.452183,1.025884 -3.228483,0.427775 -2.470859,-1.783578 1.142302,-3.334151 7.989646,-2.70691 10.76096,-0.529478 7.086205,5.567662 -7.030321,7.834872 -4.995541,11.299482 2.485134,4.23143 8.58434,-4.74325 14.690201,0.9024 12.934743,11.9598 -11.751138,32.25847 9.310751,52.02317 -4.821813,6.64762 -13.511962,7.23154 -24.400323,3.40446 z"
                           id="path12039"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="csssssssscc" />
                        <path
                           style="fill:#dc6565;fill-opacity:1;stroke:#000000;stroke-width:0.26458332px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"
                           d="m 85.826969,165.6801 c 0,0 5.504379,5.49109 14.717241,3.38156 -1.856601,-21.6785 26.48431,-38.53266 30.8875,-3.48076 6.32787,5.37438 12.94028,2.59007 12.94028,2.59007 -3.8843,-47.84594 -57.911122,-41.0765 -58.545021,-2.49087 z"
                           id="path12041"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="ccccc" />
                        <path
                           style="fill:#dc6565;fill-opacity:1;stroke:#000000;stroke-width:0.26458332px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"
                           d="m 172.22635,166.69963 c -9.04566,-25.85237 -14.37265,-28.04156 -20.36446,-42.33046 -6.60115,-15.74201 -2.92643,-29.471334 8.0241,-31.668655 24.75647,-4.967594 21.99074,26.129245 42.83592,19.356805 4.66015,-1.51405 3.0359,3.70222 4.46257,5.36414 1.95311,2.27518 1.84557,6.23936 -0.78195,7.64977 -7.31781,3.92806 -10.51028,-1.02376 -15.30338,-5.24294 -7.29177,-6.41864 -18.80579,0.92581 -17.89526,10.41292 1.18781,12.37619 10.92739,25.6532 14.25638,37.32192 0,0 -6.47604,3.56471 -15.23392,-0.8635 z"
                           id="path12043"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="cssssssscc" />
                        <path
                           style="fill:#dc6565;fill-opacity:1;stroke:#000000;stroke-width:0.26458332px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"
                           d="m 159.00871,99.222525 c 0,0 -0.95447,1.782845 -2.69036,0.703256 0,0 -2.44751,-13.961058 -16.25187,-16.627552 -1.89019,-0.365116 -2.67427,-2.571055 -0.74419,-4.349974 2.005,-1.847988 5.4338,-1.968006 5.63168,-0.867601 0.86328,4.800747 13.19735,7.831393 14.05474,21.141871 z"
                           id="path12045"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="ccsssc" />
                        <path
                           style="fill:#611616;fill-opacity:1;stroke:#000000;stroke-width:0.26458332px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"
                           d="m 142.95857,78.513221 c -1.00621,-1.084066 -5.24336,2.426638 -3.59514,3.394552 1.64823,0.967915 4.60134,-2.310486 3.59514,-3.394552 z"
                           id="path12047"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="csc" />
                        <path
                           style="fill:#dc6565;fill-opacity:1;stroke:#000000;stroke-width:0.26458332px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"
                           d="m 169.29788,75.427679 c 2.89189,1.0347 2.23297,5.076879 2.23297,5.076879 -0.20518,2.698519 -5.76161,-2.262947 -4.52666,15.156336 0,0 -1.05643,1.067036 -2.28936,0.04928 0,0 -2.77164,-20.317254 4.58305,-20.282497 z"
                           id="path12049"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="ccccc" />
                        <path
                           style="fill:#eeeeee;fill-opacity:1;stroke:#000000;stroke-width:0.26458332px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"
                           d="m 173.03867,98.349649 c -0.63594,0.488347 1.24538,8.928831 11.60384,7.494411 5.50895,-0.76286 0.41674,-16.725205 -11.60384,-7.494411 z"
                           id="path12051"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="sss" />
                        <path
                           style="fill:#dc6565;fill-opacity:1;stroke:#000000;stroke-width:0.26458332px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"
                           d="m 173.03867,98.349649 c 5.42828,-4.386072 9.55699,-2.265864 9.55699,-2.265864 0,0 -1.7295,5.559915 -8.02512,6.551755 -1.79046,-1.88509 -1.53187,-4.285891 -1.53187,-4.285891 z"
                           id="path12053"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="cccc" />
                        <path
                           style="fill:#020000;fill-opacity:1;stroke:#000000;stroke-width:0.26458332px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"
                           d="m 180.84318,99.422714 c 0.9766,4.434366 -3.02561,5.534916 -3.02561,5.534916 0,0 -2.77803,-1.28969 -3.24703,-2.32209 3.30808,-0.25736 6.27264,-3.212826 6.27264,-3.212826 z"
                           id="path12055"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="cccc" />
                        <path
                           style="fill:#f1f1f1;fill-opacity:1;stroke:#000000;stroke-width:0.26458332px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"
                           d="m 162.07364,108.31164 c 0.81142,8.86849 20.28385,4.38259 10.28366,-5.29337 0,0 -7.63177,1.64964 -10.28366,5.29337 z"
                           id="path12057"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="ccc" />
                        <path
                           style="fill:#dc6565;fill-opacity:1;stroke:#000000;stroke-width:0.26458332px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"
                           d="m 162.07364,108.31164 c 0,0 3.98016,-4.09038 10.28366,-5.29337 -2.17319,-4.098344 -15.68578,-2.94265 -10.28366,5.29337 z"
                           id="path12059"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="ccc" />
                        <path
                           style="fill:#000000;fill-opacity:1;stroke:#000000;stroke-width:0.26458332px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"
                           d="m 168.26694,104.40942 c 0,0 -4.64047,1.66593 -6.1933,3.90222 1.14879,3.78532 11.20113,1.2955 6.1933,-3.90222 z"
                           id="path12061"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="ccc" />
                        <path
                           style="fill:#611616;fill-opacity:1;stroke:#000000;stroke-width:0.26458332px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"
                           d="m 203.56342,114.82965 c 1.26083,0.13893 0.66987,2.74599 1.72193,3.59712 1.70181,1.37679 0.9262,3.99126 -0.70616,4.45455 -8.39569,2.38283 -6.28941,-8.63281 -1.01577,-8.05167 z"
                           id="path12063"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="ssss" />
                        <path
                           style="fill:none;stroke:#ffffff;stroke-width:3;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
                           d="m 35.282507,187.37586 c 2.20029,2.74327 2.375329,11.6906 2.375329,11.6906 -0.118383,-15.28452 7.6201,0.13435 7.6201,0.13435 5.158587,-1.77018 8.105635,-6.26945 7.349788,-7.31902 -0.810602,-1.12558 -2.652699,-0.66417 -3.819151,1.07413 -3.930145,5.85687 6.21046,4.84859 9.447683,1.54918"
                           id="path12065-7"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="cccssc" />
                        <path
                           style="fill:none;stroke:#ffffff;stroke-width:3;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
                           d="m 59.337898,197.64094 -1.390846,-5.51758 c 0,0 8.493698,-3.52125 7.280761,0.0915"
                           id="path12067-1"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="ccc" />
                        <path
                           style="fill:none;stroke:#ffffff;stroke-width:3;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
                           d="m 64.94545,196.10544 c 8.872352,-0.63154 9.236374,-4.78069 7.848925,-5.51168 -1.221248,-0.64343 -4.380095,0.79434 -3.621659,3.85075 0.499237,2.01186 6.365494,1.38949 6.365494,1.38949"
                           id="path12069-7"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="cssc" />
                        <path
                           style="fill:none;stroke:#ffffff;stroke-width:3;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
                           d="m 42.795087,186.1404 c -4.097746,0.91182 2.482849,13.06041 2.482849,13.06041"
                           id="path12071-1"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="cc" />
                        <path
                           style="fill:none;stroke:#000000;stroke-width:2;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
                           d="m 35.282508,187.37586 c 2.20029,2.74327 2.375329,11.6906 2.375329,11.6906 -0.118383,-15.28452 7.6201,0.13435 7.6201,0.13435 5.158587,-1.77018 8.105635,-6.26945 7.349788,-7.31902 -0.810602,-1.12558 -2.652699,-0.66417 -3.819151,1.07413 -3.930145,5.85687 6.21046,4.84859 9.447683,1.54918"
                           id="path12065"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="cccssc" />
                        <path
                           style="fill:none;stroke:#000000;stroke-width:2;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
                           d="m 59.337899,197.64094 -1.390846,-5.51758 c 0,0 8.493699,-3.52125 7.280761,0.0915"
                           id="path12067"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="ccc" />
                        <path
                           style="fill:none;stroke:#ffffff;stroke-width:3;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
                           d="m 90.302106,198.23167 c 0,0 -0.701056,-5.66271 -3.320751,-12.39863 2.051846,-1.29907 4.030056,-1.126 5.070771,0.33841 1.80204,2.53569 -2.362697,6.83439 -2.362697,6.83439 0,0 3.737009,-3.72594 5.032351,-1.03854 2.508916,5.20514 -3.23636,6.60747 -3.23636,6.60747"
                           id="path12075-8"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="ccscsc" />
                        <path
                           style="fill:none;stroke:#000000;stroke-width:2;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
                           d="m 64.945451,196.10544 c 8.872352,-0.63154 9.236374,-4.78069 7.848924,-5.51168 -1.221247,-0.64343 -4.380095,0.79434 -3.621659,3.85075 0.499239,2.01186 6.365496,1.38949 6.365496,1.38949"
                           id="path12069"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="cssc" />
                        <path
                           style="fill:none;stroke:#ffffff;stroke-width:3;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
                           d="m 100.16199,197.23842 c 2.56051,-0.90635 4.00909,-3.55988 2.67192,-4.69981 -1.60303,-1.36658 -5.572493,3.15141 -4.214762,4.77688 1.294924,1.55029 3.184582,2.80985 10.644692,1.21886"
                           id="path12077-6"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="cssc" />
                        <path
                           style="fill:none;stroke:#000000;stroke-width:2;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
                           d="m 42.795088,186.1404 c -4.097746,0.91182 2.482849,13.06041 2.482849,13.06041"
                           id="path12071"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="cc" />
                        <path
                           style="fill:none;stroke:#ffffff;stroke-width:3;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
                           d="m 114.83732,187.52935 2.73511,9.44761 c 3.72697,0.69203 8.50228,-3.74159 6.39886,-8.30388 -0.7192,-1.5599 -3.85332,-5.9528 -12.34004,-2.48953"
                           id="path12079-8"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="ccsc" />
                        <path
                           style="fill:none;stroke:#000000;stroke-width:2;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
                           d="m 90.302107,198.23167 c 0,0 -0.701057,-5.66271 -3.320752,-12.39863 2.051848,-1.29907 4.030056,-1.126 5.070773,0.33841 1.802038,2.53569 -2.362698,6.83439 -2.362698,6.83439 0,0 3.737009,-3.72594 5.03235,-1.03854 2.508918,5.20514 -3.236359,6.60747 -3.236359,6.60747"
                           id="path12075"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="ccscsc" />
                        <path
                           style="fill:none;stroke:#ffffff;stroke-width:3;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
                           d="m 126.57379,191.40455 c 0,0 1.39249,4.7615 1.35938,4.44629 -2.66333,-9.57827 5.70234,-4.97564 5.70234,-4.97564"
                           id="path12081-0"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="ccc" />
                        <path
                           style="fill:none;stroke:#000000;stroke-width:2;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
                           d="m 100.16199,197.23842 c 2.56051,-0.90635 4.00909,-3.55988 2.67192,-4.69981 -1.60303,-1.36658 -5.572492,3.15141 -4.214761,4.77688 1.294924,1.55029 3.184581,2.80985 10.644691,1.21886"
                           id="path12077"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="cssc" />
                        <path
                           style="fill:none;stroke:#ffffff;stroke-width:3;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
                           d="m 141.90184,194.5322 c -1.7363,-0.34875 -4.9924,-4.85074 -4.9924,-4.85074 -6.83568,3.69247 -1.00263,8.05123 2.31622,3.64465"
                           id="path12083-7"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="ccc" />
                        <path
                           style="fill:none;stroke:#000000;stroke-width:2;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
                           d="m 114.83732,187.52935 2.73511,9.44761 c 3.72697,0.69203 8.50228,-3.74159 6.39886,-8.30388 -0.7192,-1.5599 -3.85332,-5.9528 -12.34004,-2.48953"
                           id="path12079"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="ccsc" />
                        <path
                           style="fill:none;stroke:#ffffff;stroke-width:3;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
                           d="m 146.23767,192.5258 c -10.67815,0.0807 -1.03861,-4.62871 -1.03861,-4.62871 5.93274,3.68968 10.28601,10.35083 8.30875,12.15086 -2.49664,2.27285 -10.79901,2.22869 -11.53487,-1.8052 -0.34324,-1.88165 1.56544,-3.85075 5.24254,-4.46196 2.59377,-0.43112 5.38707,-0.43881 7.59886,-0.71123 6.24679,-0.76938 0.45555,-9.82091 -1.55378,-0.43166"
                           id="path12085-8"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="ccssssc" />
                        <path
                           style="fill:none;stroke:#000000;stroke-width:2;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
                           d="m 126.57379,191.40455 c 0,0 1.39249,4.7615 1.35938,4.44629 -2.66333,-9.57827 5.70234,-4.97564 5.70234,-4.97564"
                           id="path12081"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="ccc" />
                        <path
                           style="fill:none;stroke:#ffffff;stroke-width:3;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
                           d="m 159.28871,189.75261 1.50886,3.64449 c -3.12784,-9.55072 2.20802,-7.498 4.24172,-1.48662"
                           id="path12087-6"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="ccc" />
                        <path
                           style="fill:none;stroke:#000000;stroke-width:2;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
                           d="m 141.90184,194.5322 c -1.7363,-0.34875 -4.9924,-4.85074 -4.9924,-4.85074 -6.83568,3.69247 -1.00263,8.05123 2.31622,3.64465"
                           id="path12083"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="ccc" />
                        <path
                           style="fill:none;stroke:#ffffff;stroke-width:3;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
                           d="m 172.73247,186.47076 c -0.39178,-3.93181 -6.84612,0.76166 -6.84612,0.76166 0.81237,1.89185 10.21311,3.04081 9.44366,6.16779 -0.45305,1.84114 -4.76123,0.18147 -5.91153,0.55725"
                           id="path12089-6"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="cssc" />
                        <path
                           style="fill:none;stroke:#000000;stroke-width:2;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
                           d="m 146.23767,192.5258 c -10.67815,0.0807 -1.03861,-4.62871 -1.03861,-4.62871 5.93274,3.68968 10.28601,10.35083 8.30875,12.15086 -2.49664,2.27285 -10.79901,2.22869 -11.53487,-1.8052 -0.34324,-1.88165 1.56544,-3.85075 5.24254,-4.46196 2.59377,-0.43112 5.38707,-0.43881 7.59886,-0.71123 6.24679,-0.76938 0.45555,-9.82091 -1.55378,-0.43166"
                           id="path12085"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="ccssssc" />
                        <path
                           style="fill:none;stroke:#000000;stroke-width:2;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
                           d="m 159.28871,189.75261 1.50886,3.64449 c -3.12784,-9.55072 2.20802,-7.498 4.24172,-1.48662"
                           id="path12087"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="ccc" />
                        <path
                           style="fill:none;stroke:#000000;stroke-width:2;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
                           d="m 172.73247,186.47076 c -0.39178,-3.93181 -6.84612,0.76166 -6.84612,0.76166 0.81237,1.89185 10.21311,3.04081 9.44366,6.16779 -0.45305,1.84114 -4.76123,0.18147 -5.91153,0.55725"
                           id="path12089"
                           inkscape:connector-curvature="0"
                           sodipodi:nodetypes="cssc" />
                      </g>
                    </svg>`,




    'edit': `<svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="1.92em" 
                  fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16">
               <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 
                        .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 
                        2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
               <path fill-rule="evenodd" 
                     d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 
                        0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 
                        0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
            </svg>`,

    'edit_small': `<svg xmlns="http://www.w3.org/2000/svg" width="1.00em" height="1.00em" 
                        fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16">
                     <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 
                              .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 
                              2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                     <path fill-rule="evenodd" 
                           d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 
                              0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 
                              0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
                  </svg>`,

    'flower': `<svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="1.92em" 
                    fill="currentColor" class="bi bi-flower1" viewBox="0 0 16 16">
                 <path d="M6.174 1.184a2 2 0 0 1 3.652 0A2 2 0 0 1 12.99 3.01a2 2 0 0 1 1.826 3.164 2 2 0 0 1 0 
                          3.652 2 2 0 0 1-1.826 3.164 2 2 0 0 1-3.164 1.826 2 2 0 0 1-3.652 0A2 2 0 0 1 3.01 
                          12.99a2 2 0 0 1-1.826-3.164 2 2 0 0 1 0-3.652A2 2 0 0 1 3.01 3.01a2 2 0 0 1 3.164-1.826zM8 
                          1a1 1 0 0 0-.998 1.03l.01.091c.012.077.029.176.054.296.049.241.122.542.213.887.182.688.428 1.513.676 
                          2.314L8 5.762l.045-.144c.248-.8.494-1.626.676-2.314.091-.345.164-.646.213-.887a4.997 
                          4.997 0 0 0 .064-.386L9 2a1 1 0 0 0-1-1zM2 9l.03-.002.091-.01a4.99 4.99 0 0 0 
                          .296-.054c.241-.049.542-.122.887-.213a60.59 60.59 0 0 0 2.314-.676L5.762 
                          8l-.144-.045a60.59 60.59 0 0 0-2.314-.676 16.705 16.705 0 0 0-.887-.213 4.99 4.99 0 0 
                          0-.386-.064L2 7a1 1 0 1 0 0 2zm7 5-.002-.03a5.005 5.005 0 0 0-.064-.386 16.398 16.398 0 0 
                          0-.213-.888 60.582 60.582 0 0 0-.676-2.314L8 10.238l-.045.144c-.248.8-.494 1.626-.676 
                          2.314-.091.345-.164.646-.213.887a4.996 4.996 0 0 0-.064.386L7 14a1 1 0 1 0 2 
                          0zm-5.696-2.134.025-.017a5.001 5.001 0 0 0 .303-.248c.184-.164.408-.377.661-.629A60.614 
                          60.614 0 0 0 5.96 9.23l.103-.111-.147.033a60.88 60.88 0 0 0-2.343.572c-.344.093-.64.18-.874.258a5.063 
                          5.063 0 0 0-.367.138l-.027.014a1 1 0 1 0 1 1.732zM4.5 14.062a1 1 0 0 0 
                          1.366-.366l.014-.027c.01-.02.021-.048.036-.084a5.09 5.09 0 0 0 .102-.283c.078-.233.165-.53.258-.874a60.6 
                          60.6 0 0 0 .572-2.343l.033-.147-.11.102a60.848 60.848 0 0 0-1.743 1.667 17.07 17.07 0 0 0-.629.66 5.06 
                          5.06 0 0 0-.248.304l-.017.025a1 1 0 0 0 .366 1.366zm9.196-8.196a1 1 0 0 0-1-1.732l-.025.017a4.951 
                          4.951 0 0 0-.303.248 16.69 16.69 0 0 0-.661.629A60.72 60.72 0 0 0 10.04 6.77l-.102.111.147-.033a60.6 
                          60.6 0 0 0 2.342-.572c.345-.093.642-.18.875-.258a4.993 4.993 0 0 0 .367-.138.53.53 0 0 0 .027-.014zM11.5 
                          1.938a1 1 0 0 0-1.366.366l-.014.027c-.01.02-.021.048-.036.084a5.09 5.09 0 0 
                          0-.102.283c-.078.233-.165.53-.258.875a60.62 60.62 0 0 0-.572 2.342l-.033.147.11-.102a60.848 60.848 0 0 0 
                          1.743-1.667c.252-.253.465-.477.629-.66a5.001 5.001 0 0 0 .248-.304l.017-.025a1 1 0 0 0-.366-1.366zM14 9a1 
                          1 0 0 0 0-2l-.03.002a4.996 4.996 0 0 0-.386.064c-.242.049-.543.122-.888.213-.688.182-1.513.428-2.314.676L10.238 
                          8l.144.045c.8.248 1.626.494 2.314.676.345.091.646.164.887.213a4.996 4.996 0 0 0 .386.064L14 9zM1.938 4.5a1 
                          1 0 0 0 .393 1.38l.084.035c.072.03.166.064.283.103.233.078.53.165.874.258a60.88 60.88 0 0 0 
                          2.343.572l.147.033-.103-.111a60.584 60.584 0 0 0-1.666-1.742 16.705 16.705 0 0 0-.66-.629 4.996 4.996 0 0 
                          0-.304-.248l-.025-.017a1 1 0 0 0-1.366.366zm2.196-1.196.017.025a4.996 4.996 0 0 0 
                          .248.303c.164.184.377.408.629.661A60.597 60.597 0 0 0 6.77 5.96l.111.102-.033-.147a60.602 60.602 0 0 
                          0-.572-2.342c-.093-.345-.18-.642-.258-.875a5.006 5.006 0 0 0-.138-.367l-.014-.027a1 1 0 1 0-1.732 1zm9.928 
                          8.196a1 1 0 0 0-.366-1.366l-.027-.014a5 5 0 0 0-.367-.138c-.233-.078-.53-.165-.875-.258a60.619 60.619 0 0 
                          0-2.342-.572l-.147-.033.102.111a60.73 60.73 0 0 0 1.667 1.742c.253.252.477.465.66.629a4.946 4.946 0 0 0 
                          .304.248l.025.017a1 1 0 0 0 1.366-.366zm-3.928 2.196a1 1 0 0 0 1.732-1l-.017-.025a5.065 5.065 0 0 
                          0-.248-.303 16.705 16.705 0 0 0-.629-.661A60.462 60.462 0 0 0 9.23 10.04l-.111-.102.033.147a60.6 60.6 0 0 0 
                          .572 2.342c.093.345.18.642.258.875a4.985 4.985 0 0 0 .138.367.575.575 0 0 0 .014.027zM8 9.5a1.5 1.5 0 1 0 
                          0-3 1.5 1.5 0 0 0 0 3z"/>
               </svg>`,

    'folder':       `<svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="1.92em" 
                          fill="currentColor" class="bi bi-folder" viewBox="0 0 16 16">
                       <path d="M.54 3.87.5 3a2 2 0 0 1 2-2h3.672a2 2 0 0 1 1.414.586l.828.828A2 
                                2 0 0 0 9.828 3h3.982a2 2 0 0 1 1.992 2.181l-.637 7A2 2 0 0 1 
                                13.174 14H2.826a2 2 0 0 1-1.991-1.819l-.637-7a1.99 1.99 0 0 1 
                                .342-1.31zM2.19 4a1 1 0 0 0-.996 1.09l.637 7a1 1 0 0 0 
                                .995.91h10.348a1 1 0 0 0 .995-.91l.637-7A1 1 0 0 0 13.81 
                                4H2.19zm4.69-1.707A1 1 0 0 0 6.172 2H2.5a1 1 0 0 0-1 
                                .981l.006.139C1.72 3.042 1.95 3 2.19 3h5.396l-.707-.707z"/>
                     </svg>`,

    'goto_bottom':  `<svg xmlns="http://www.w3.org/2000/svg" width="1.96em" height="1.96em" 
                          fill="currentColor" class="bi bi-arrow-down-square" viewBox="0 0 16 16">
                        <path fill-rule="evenodd" 
                          d="M15 2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 
                             1-1V2zM0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 
                             1-2-2V2zm8.5 2.5a.5.5 0 0 0-1 0v5.793L5.354 8.146a.5.5 0 1 
                             0-.708.708l3 3a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V4.5z"/>
                     </svg>`,

    'image':     `<svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="1.92em" 
                       fill="currentColor" class="bi bi-file-image" viewBox="0 0 16 16">
                    <path d="M8.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
                    <path d="M12 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 
                             2-2V2a2 2 0 0 0-2-2zM3 2a1 1 0 0 1 1-1h8a1 1 0 0 1 1 
                             1v8l-2.083-2.083a.5.5 0 0 0-.76.063L8 11 5.835 
                             9.7a.5.5 0 0 0-.611.076L3 12V2z"/>
                  </svg>`,

    'locked':         `<svg xmlns="http://www.w3.org/2000/svg" width="1.00em" height="1.00em" 
                            fill="currentColor" class="bi bi-lock" viewBox="0 0 16 16">
                         <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 
                                  0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 
                                  0-2-2zM5 8h6a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9a1 
                                  1 0 0 1 1-1z"/>
                       </svg>`,


    'message':     `<svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="1.92em" 
                         fill="currentColor" class="bi bi-journal-arrow-up" viewBox="0 0 16 16">
                      <path fill-rule="evenodd" 
                            d="M8 11a.5.5 0 0 0 .5-.5V6.707l1.146 1.147a.5.5 0 0 0 
                               .708-.708l-2-2a.5.5 0 0 0-.708 0l-2 2a.5.5 0 1 0 
                               .708.708L7.5 6.707V10.5a.5.5 0 0 0 .5.5z"/>
                      <path d="M3 0h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 
                               1-2-2v-1h1v1a1 1 0 0 0 1 1h10a1 1 0 0 0 
                               1-1V2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v1H1V2a2 2 0 0 1 2-2z"/>
                      <path d="M1 5v-.5a.5.5 0 0 1 1 0V5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 
                               0-1H1zm0 3v-.5a.5.5 0 0 1 1 0V8h.5a.5.5 0 0 1 0 
                               1h-2a.5.5 0 0 1 0-1H1zm0 3v-.5a.5.5 0 0 1 1 
                               0v.5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1z"/>
                    </svg>`,

    'new_tab_small':   `<svg xmlns="http://www.w3.org/2000/svg" width="1.0em" height="1.0em" 
                             fill="currentColor" class="bi bi-box-arrow-up-right" viewBox="0 0 16 16">
                          <path fill-rule="evenodd" d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 
                                           4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 
                                           1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 
                                           1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 
                                           .5-.5h6.636a.5.5 0 0 0 .5-.5z"/>
                          <path fill-rule="evenodd" d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 
                                           1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 
                                           1.707V5.5a.5.5 0 0 0 1 0v-5z"/>
                        </svg>`,

    'new_tab':   `<svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="1.92em" 
                         fill="currentColor" class="bi bi-box-arrow-up-right" viewBox="0 0 16 16">
                      <path fill-rule="evenodd" d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 
                                       4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 
                                       1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 
                                       1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 
                                       .5-.5h6.636a.5.5 0 0 0 .5-.5z"/>
                      <path fill-rule="evenodd" d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 
                                       1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 
                                       1.707V5.5a.5.5 0 0 0 1 0v-5z"/>
                    </svg>`,

    'outlet':    `<svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="1.92em" 
                       fill="currentColor" class="bi bi-outlet" viewBox="0 0 16 16">
                    <path d="M3.34 2.994c.275-.338.68-.494 1.074-.494h7.172c.393 0 .798.156 1.074.494.578.708 
                             1.84 2.534 1.84 5.006 0 2.472-1.262 4.297-1.84 5.006-.276.338-.68.494-1.074.494H4.414c-.394 
                             0-.799-.156-1.074-.494C2.762 12.297 1.5 10.472 1.5 8c0-2.472 1.262-4.297 
                             1.84-5.006zm1.074.506a.376.376 0 0 0-.299.126C3.599 4.259 2.5 5.863 2.5 8c0 2.137 
                             1.099 3.74 1.615 4.374.06.073.163.126.3.126h7.17c.137 0 .24-.053.3-.126.516-.633 
                             1.615-2.237 1.615-4.374 0-2.137-1.099-3.74-1.615-4.374a.376.376 0 0 0-.3-.126h-7.17z"/>
                    <path d="M6 5.5a.5.5 0 0 1 .5.5v1.5a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm4 0a.5.5 0 0 1 .5.5v1.5a.5.5 
                             0 0 1-1 0V6a.5.5 0 0 1 .5-.5zM7 10v1h2v-1a1 1 0 0 0-2 0z"/>
                  </svg>`,

    'paperclip': `<svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="1.92em" 
                           fill="currentColor" class="bi bi-paperclip" viewBox="0 0 16 16">
                        <path d="M4.5 3a2.5 2.5 0 0 1 5 0v9a1.5 1.5 0 0 1-3 
                                 0V5a.5.5 0 0 1 1 0v7a.5.5 0 0 0 1 0V3a1.5 1.5 0 1 
                                 0-3 0v9a2.5 2.5 0 0 0 5 0V5a.5.5 0 0 1 1 0v7a3.5 3.5 0 1 1-7 0V3z"/>
                      </svg>`,

    'pdf':     `<svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="1.92em" 
                     fill="currentColor" class="bi bi-file-pdf" viewBox="0 0 16 16">
                  <path d="M4 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2a2 2 0 0 
                           0-2-2H4zm0 1h8a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 
                           1 0 0 1 1-1z"/>
                  <path d="M4.603 12.087a.81.81 0 0 1-.438-.42c-.195-.388-.13-.776.08-1.102.198-.307.526-.568.897-.787a7.68 7.68 
                           0 0 1 1.482-.645 19.701 19.701 0 0 0 1.062-2.227 7.269 7.269 0 0 
                           1-.43-1.295c-.086-.4-.119-.796-.046-1.136.075-.354.274-.672.65-.823.192-.077.4-.12.602-.077a.7.7 
                           0 0 1 .477.365c.088.164.12.356.127.538.007.187-.012.395-.047.614-.084.51-.27 1.134-.52 
                           1.794a10.954 10.954 0 0 0 .98 1.686 5.753 5.753 0 0 1 
                           1.334.05c.364.065.734.195.96.465.12.144.193.32.2.518.007.192-.047.382-.138.563a1.04 1.04 
                           0 0 1-.354.416.856.856 0 0 1-.51.138c-.331-.014-.654-.196-.933-.417a5.716 5.716 0 0 
                           1-.911-.95 11.642 11.642 0 0 0-1.997.406 11.311 11.311 0 0 1-1.021 
                           1.51c-.29.35-.608.655-.926.787a.793.793 0 0 
                           1-.58.029zm1.379-1.901c-.166.076-.32.156-.459.238-.328.194-.541.383-.647.547-.094.145-.096.25-.04.361.01.022.02.036.026.044a.27.27 
                           0 0 0 .035-.012c.137-.056.355-.235.635-.572a8.18 8.18 0 0 0 .45-.606zm1.64-1.33a12.647 
                           12.647 0 0 1 1.01-.193 11.666 11.666 0 0 1-.51-.858 20.741 20.741 0 0 1-.5 
                           1.05zm2.446.45c.15.162.296.3.435.41.24.19.407.253.498.256a.107.107 0 0 0 .07-.015.307.307 
                           0 0 0 .094-.125.436.436 0 0 0 .059-.2.095.095 0 0 0-.026-.063c-.052-.062-.2-.152-.518-.209a3.881 
                           3.881 0 0 0-.612-.053zM8.078 5.8a6.7 6.7 0 0 0 .2-.828c.031-.188.043-.343.038-.465a.613.613 
                           0 0 0-.032-.198.517.517 0 0 
                           0-.145.04c-.087.035-.158.106-.196.283-.04.192-.03.469.046.822.024.111.054.227.09.346z"/>
                </svg>`,

    'person':    `<svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="1.92em" 
                       fill="currentColor" class="bi bi-person" viewBox="0 0 16 16">
                    <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 
                             0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 
                             4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 
                             10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 
                             1.418-.832 1.664h10z"/>
                  </svg>`,

    'person_small':    `<svg xmlns="http://www.w3.org/2000/svg" width="1.0em" height="1.0em" 
                             fill="currentColor" class="bi bi-person" viewBox="0 0 16 16">
                          <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 
                                   0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 
                                   4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 
                                   10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 
                                   1.418-.832 1.664h10z"/>
                        </svg>`,

    'person_add':      `<svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="16" 
                             fill="currentColor" class="bi bi-person-add" viewBox="0 0 16 16">
                          <path d="M12.5 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm.5-5v1h1a.5.5 
                                   0 0 1 0 1h-1v1a.5.5 0 0 1-1 0v-1h-1a.5.5 0 0 1 0-1h1v-1a.5.5 
                                   0 0 1 1 0Zm-2-6a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM8 7a2 2 0 1 0 
                                   0-4 2 2 0 0 0 0 4Z"/>
                          <path d="M8.256 14a4.474 4.474 0 0 1-.229-1.004H3c.001-.246.154-.986.832-1.664C4.484 
                                   10.68 5.711 10 8 10c.26 0 .507.009.74.025.226-.341.496-.65.804-.918C9.077 
                                   9.038 8.564 9 8 9c-5 0-6 3-6 4s1 1 1 1h5.256Z"/>
                        </svg>`,

    'play':    `<svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="1.92em" 
                      fill="currentColor" class="bi bi-caret-right" viewBox="0 0 16 16">
                   <path d="M6 12.796V3.204L11.481 8 6 12.796zm.659.753 5.48-4.796a1 
                            1 0 0 0 0-1.506L6.66 2.451C6.011 1.885 5 2.345 5 
                            3.204v9.592a1 1 0 0 0 1.659.753z"/>
                 </svg>`,
    'plug':    `<svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="1.92em" 
                     fill="currentColor" class="bi bi-plug" viewBox="0 0 16 16">
                  <path d="M6 0a.5.5 0 0 1 .5.5V3h3V.5a.5.5 0 0 1 1 0V3h1a.5.5 0 0 1 .5.5v3A3.5 
                           3.5 0 0 1 8.5 10c-.002.434-.01.845-.04 1.22-.041.514-.126 1.003-.317 
                           1.424a2.083 2.083 0 0 1-.97 1.028C6.725 13.9 6.169 14 5.5 14c-.998 
                           0-1.61.33-1.974.718A1.922 1.922 0 0 0 3 16H2c0-.616.232-1.367.797-1.968C3.374 
                           13.42 4.261 13 5.5 13c.581 0 
                           .962-.088 1.218-.219.241-.123.4-.3.514-.55.121-.266.193-.621.23-1.09.027-.34.035-.718.037-1.141A3.5 
                           3.5 0 0 1 4 6.5v-3a.5.5 0 0 1 .5-.5h1V.5A.5.5 0 0 1 6 0zM5 4v2.5A2.5 2.5 
                           0 0 0 7.5 9h1A2.5 2.5 0 0 0 11 6.5V4H5z"/>
                </svg>`,
    'pause':   `<svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="1.92em" 
                     fill="currentColor" class="bi bi-pause-fill" viewBox="0 0 16 16">
                  <path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 
                           1.5 0 0 1 1.5-1.5zm5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 
                           0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5z"/>
                 </svg>`,

    'telephone': `<svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="1.92em" 
                       fill="currentColor" class="bi bi-telephone-outbound" viewBox="0 0 16 16">
                    <path d="M3.654 1.328a.678.678 0 0 0-1.015-.063L1.605 2.3c-.483.484-.661 
                             1.169-.45 1.77a17.568 17.568 0 0 0 4.168 6.608 17.569 17.569 0 0 0 
                             6.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 0 
                             0-.063-1.015l-2.307-1.794a.678.678 0 0 0-.58-.122l-2.19.547a1.745 
                             1.745 0 0 1-1.657-.459L5.482 8.062a1.745 1.745 0 0 
                             1-.46-1.657l.548-2.19a.678.678 0 0 0-.122-.58L3.654 1.328zM1.884.511a1.745 
                             1.745 0 0 1 2.612.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 
                             2.19a.678.678 0 0 0 .178.643l2.457 2.457a.678.678 0 0 0 
                             .644.178l2.189-.547a1.745 1.745 0 0 1 1.494.315l2.306 1.794c.829.645.905 
                             1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.634 18.634 
                             0 0 1-7.01-4.42 18.634 18.634 0 0 
                             1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877L1.885.511zM11 .5a.5.5 0 0 1 
                             .5-.5h4a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V1.707l-4.146 4.147a.5.5 0 0 
                             1-.708-.708L14.293 1H11.5a.5.5 0 0 1-.5-.5z"/>
                  </svg>`,

     'search':  `<svg xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.5em" 
                      fill="currentColor" class="bi bi-search" viewBox="0 0 16 16">
                   <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 
                            3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 
                            5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
                 </svg>`,

    'trash':    `<svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="1.92em" 
                       fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
                    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 
                             .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 
                             .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                    <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 
                                     2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 
                                     1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 
                                     1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 
                                     1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                  </svg>`,

    'unlocked':       `<svg xmlns="http://www.w3.org/2000/svg" width="1.00em" height="1.00em" 
                            fill="currentColor" class="bi bi-unlock" viewBox="0 0 16 16">
                         <path d="M11 1a2 2 0 0 0-2 2v4a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H3a2 2 0 0 
                                  1-2-2V9a2 2 0 0 1 2-2h5V3a3 3 0 0 1 6 0v4a.5.5 0 0 1-1 0V3a2 
                                  2 0 0 0-2-2zM3 8a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h6a1 1 0 0 0 
                                  1-1V9a1 1 0 0 0-1-1H3z"/>
                        </svg>`,
  
    'unknown': `<svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="1.92em" 
                     fill="currentColor" class="bi bi-file" viewBox="0 0 16 16">
                  <path d="M4 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2a2 
                           2 0 0 0-2-2H4zm0 1h8a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 
                           1 0 0 1-1-1V2a1 1 0 0 1 1-1z"/>
                </svg>`,


    'video':     `<svg xmlns="http://www.w3.org/2000/svg" width="1.92em" height="1.92em" 
                       fill="currentColor" class="bi bi-camera-video" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M0 5a2 2 0 0 1 2-2h7.5a2 2 0 0 1 1.983 
                                     1.738l3.11-1.382A1 1 0 0 1 16 4.269v7.462a1 1 0 0 
                                     1-1.406.913l-3.111-1.382A2 2 0 0 1 9.5 13H2a2 2 0 0 
                                     1-2-2V5zm11.5 5.175 3.5 1.556V4.269l-3.5 1.556v4.35zM2 
                                     4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h7.5a1 1 0 0 0 1-1V5a1 
                                     1 0 0 0-1-1H2z"/>
                  </svg>`
    };

