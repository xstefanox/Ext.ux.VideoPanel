/*jslint browser: true, sloppy: true, white: true */
/*global Ext: true, VideoJS: true */

/**
 * A panel implementing an HTML5 video player.
 * Use the `video` config option to add the file references.
 * VideoJS is needed for this component to work.
 * 
 * Add this to your page to load VideoJS:
 * 
 *   <script src="http://vjs.zencdn.net/c/video.js" type="text/javascript"></script>
 *   <link href="http://vjs.zencdn.net/c/video-js.css" rel="stylesheet">
 * 
 * Example:
 * 
 *      Ext.create('Ext.ux.VideoPanel', {
 *          title: 'HTML5 video panel',
 *          video: [ { url: 'big_buck_bunny.webm', type: 'video/webm' }, 'big_buck_bunny.ogg', 'big_buck_bunny.mp4' ],
 *          videoWidth: 854,
 *          videoHeight: 480
 *      });
 */
Ext.define('Ext.ux.VideoPanel', {
    extend: 'Ext.panel.Panel',
    xtype: 'videopanel',
    downloadCls: 'x-ux-videopanel-download-button',
    downloadMenuEntryCls: 'x-ux-videopanel-download-menuEntry',
    defaultSkin: 'vjs-default-skin',
    showControls: true,
    autoPlay: false,
    loop: false,
    poster: '',
    constructor: function() {
        
        // throw an exception if the VideoJS library is not available
        if (Ext.isEmpty(window.VideoJS)) {
            throw "VideoJS library not loaded";
        }
        
        // determine the skin
        this.skin = this.skin || this.defaultSkin;
        
        this.callParent(arguments);
    },
    onRender: function() {
    
        this.callParent(arguments);
        
        this.body.addCls('x-ux-videopanel-body');
        
        // create the video tag
        this.videoEl = this.body.insertFirst({
            tag: 'video',
            cls: 'video-js ' + this.skin,
            width: this.videoWidth,
            height: this.videoHeight
        });

        // add a toolbar containing the download menu
        if (this.allowDownload) {
            
            // create the toolbar
            this.addDocked({
                xtype: 'toolbar',
                dock: 'top',
                items: [
                    {
                        itemId: 'downloadMenu',
                        xtype: 'button',
                        text: 'Download',
                        iconCls: this.downloadCls,
                        // create a menu, it will be filled below
                        menu: []
                    }
                ]
            });

            // save a reference to the download menu
            this.downloadMenu = this.getDockedItems('toolbar[dock="top"]')[0].items.get('downloadMenu').menu;
        }
        
        // save a reference to the panel, because the VideoJS.ready() function does not permit scoping
        var cmp = this;
        
        // apply VideoJS to the video
        this.videoControl = new VideoJS(
            this.videoEl.id,
            {
                controls: this.showControls,
                preload: 'auto',
                autoplay: this.autoPlay,
                loop: this.loop,
                poster: this.poster
            },
            // on player ready
            function() {
            
                Ext.fly(this.el).addCls('x-ux-videopanel-video');
                
                // add ech video to the list of sources for this video element
                Ext.each(cmp.video, function(source) {

                    var url, type;

                    // determine the file url
                    if (Ext.isObject(source)) {
                        url = source.url;
                    }
                    else {
                        url = source;
                    }

                    // read the mime type, if given
                    if (Ext.isObject(source) && !Ext.isEmpty(source.type)) {
                        type = source.type;
                    }
                    // or try to determine the mime type from the file name
                    else if (/\.(ogg|ogv)$/i.test(url)) {
                        type = 'video/ogg';
                    }
                    else if (/\.(mp4)$/i.test(url)) {
                        type = 'video/mp4';
                    }
                    else if (/\.(webm)$/i.test(url)) {
                        type = 'video/webm';
                    }
                    // otherwise leave the type attribute empty
                    else {
                        type = '';
                    }

                    this.src({ src: url , type: type });

                    if (cmp.allowDownload) {

                        // add the menu entry
                        cmp.downloadMenu.add({
                            text: url,
                            href: url,
                            tooltip: 'Right-click and select "Save as..." to download',
                            iconCls: cmp.downloadMenuEntryCls
                        });
                    }
                }, this);
        });
        
    }
});
