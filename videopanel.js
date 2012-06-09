/**
 * A panel implementing an HTML5 video player.
 * Use the `video` config option to add the file references.
 * 
 * Example:
 * 
 *      Ext.create('Ext.container.Viewport', {
 *          layout: 'fit',
 *          items: {
 *              xtype: 'videopanel',
 *              title: 'HTML5 video panel',
 *              video: [ 'big_buck_bunny.webm', 'big_buck_bunny.ogg' ]
 *          }
 *      });
 */
Ext.define('Ext.ux.VideoPanel', {
    extend: 'Ext.panel.Panel',
    xtype: 'videopanel',
    layout: 'fit',
    playCls: 'x-ux-videopanel-control-play',
    pauseCls: 'x-ux-videopanel-control-pause',
    downloadCls: 'x-ux-videopanel-download-button',
    downloadMenuEntryCls: 'x-ux-videopanel-download-menuEntry',
    onRender: function() {
    
        this.callParent(arguments);
        
        // utility function to render the time value of the video
        var renderTime = function(time) {
            return Ext.util.Format.date(new Date(time * 1000), 'i:s');
        };

        // create the video tag
        this.videoEl = this.body.insertFirst({
            tag: 'video'
        });

        // ensure the video does not overflow its container
        this.videoEl.applyStyles({
            width: 'inherit',
            height: 'inherit'
        });

        // create the task that will update the current time
        this.timeUpdater = Ext.TaskManager.newTask({
            run: function() {

                // update the time text
                this.currentTime.setText(renderTime(this.videoEl.dom.currentTime));

                // update the slider position
                this.slider.setValue(this.videoEl.dom.currentTime * 100 / this.videoEl.dom.duration, false);
            },
            scope: this,
            interval: 500
        });

        // set the duration time when the video will be loaded
        this.videoEl.on('loadedmetadata', function() {
            this.duration.setText(renderTime(this.videoEl.dom.duration));
        }, this, { single: true });

        // when the video starts playing, start the time updater and change the button icon
        this.videoEl.on('playing', function() {
            this.timeUpdater.start();
            this.playButton.setIconCls(this.pauseCls);
        }, this);

        // when the video is paused, stop the time updater and change the button icon
        this.videoEl.on('pause', function() {
            this.timeUpdater.stop();
            this.playButton.setIconCls(this.playCls);
        }, this);

        // when the video is ready to start playing, enable the controls
        this.videoEl.on('canplay', function() {
            this.getDockedItems('toolbar[dock="bottom"]')[0].enable();
        }, this, { single: true });

        // we need to save a reference to the video element for the tipText() method of the slider
        var videoEl = this.videoEl;

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
        
        // create the controls toolbar
        this.addDocked({
            xtype: 'toolbar',
            dock: 'bottom',
            disabled: true,
            items: [
                {
                    itemId: 'play',
                    xtype: 'button',
                    iconCls: this.playCls,
                    handler: function() {

                        if (this.videoEl.dom.paused) {
                            this.videoEl.dom.play();
                        }
                        else {
                            this.videoEl.dom.pause();
                        }
                    },
                    scope: this
                },
                {
                    itemId: 'slider',
                    xtype: 'slider',
                    minValue: 0,
                    maxValue: 100,
                    isFill: true,
                    flex: 1,
                    tipText: function(thumb) {
                        return renderTime(thumb.value * videoEl.dom.duration / 100);
                    },
                    listeners: {
                        dragstart: {
                            fn: function() {
                                this.videoEl.playingBeforeDrag = !(this.videoEl.dom.paused || this.videoEl.dom.ended);
                                this.videoEl.dom.pause();
                            },
                            scope: this
                        },
                        dragend: {
                            fn: function() {
                                this.videoEl.dom.currentTime = this.slider.getValue() * this.videoEl.dom.duration / 100;
                                if (this.videoEl.playingBeforeDrag) {
                                    this.videoEl.dom.play();
                                    this.videoEl.playingBeforeDrag = false;
                                }
                            },
                            scope: this
                        }
                    }
                },
                {
                    itemId: 'currentTime',
                    xtype: 'tbtext',
                    text: '00:00'
                },
                {
                    xtype: 'tbtext',
                    text: '/'
                },
                {
                    itemId: 'duration',
                    xtype: 'tbtext',
                    text: '00:00'
                }
            ]
        });

        // save references to the elements of the controls toolbar
        this.playButton = this.getDockedItems('toolbar[dock="bottom"]')[0].items.get('play');
        this.slider = this.getDockedItems('toolbar[dock="bottom"]')[0].items.get('slider');
        this.currentTime = this.getDockedItems('toolbar[dock="bottom"]')[0].items.get('currentTime');
        this.duration = this.getDockedItems('toolbar[dock="bottom"]')[0].items.get('duration');
        this.downloadMenu = this.getDockedItems('toolbar[dock="top"]')[0].items.get('downloadMenu').menu;

        // add ech video to the list of sources for this video element
        Ext.each(this.video, function(url) {
            
            // add the <source> element
            this.videoEl.createChild({
                tag: 'source',
                src: url
            });
            
            // add the menu entry
            this.downloadMenu.add({
                text: url,
                href: url,
                tooltip: 'Right-click and select "Save as..." to download',
                iconCls: this.downloadMenuEntryCls
            });
            
        }, this);
    }
});
