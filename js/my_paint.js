$(function() {
    setTimeout(function()
    {
        $('#pencil').toggleClass('selected');
    }, 750);

    $('#settings .settings-color').each(function()
    {
        var btn = $(this);
        var color = btn.val();

        btn.css({backgroundColor: color});
    });

    eventHandler();
});


function eventHandler()
{
    /* Tools variables */ 
    var tools = $('#tools button');
    var toolsCount = tools.length;
    var currentTool = 0;
    var toolSize = 5;
    var toolColor = 'black';

    /* Mouse variables */
    var lastMouseWheel = getTime();
    var mouse = {x: 0, y: 0};
    var origin = null;

    /* Canvas variables */
    var layers = {
        current: 0,
        main: $('#main')[0],
        sym: $('#sym')[0],
        all: $('.layers'),
        preview: $('#layers canvas'),
        count: 1,
        selected: $('.layers')[0],
        dragDrop: [null, null]
    };

    var painting = false;
    var lastSettingsClick = getTime();

    /* Symmetry settings */
    var symmetry = 0;



    initLayerManager(layers);

    function onMouseWheel(e)
    {
        if (elapsedTime(lastMouseWheel) < 75 || painting) {
            return;
        }
        lastMouseWheel = getTime();

        if(e.originalEvent.wheelDelta / 120 > 0) 
        {
            onPreviousTool();
            return;
        }
        onNextTool();
    }

    function onMouseWheelSize(e)
    {
        var size = $('#size-container');
        if(e.originalEvent.wheelDelta / 120 > 0) 
        {
            onSizeIncrease();
            size.toggleClass('settings-giggle');
            return;
        }
        onSizeDecrease();
        size.toggleClass('settings-giggle');
    }

    function onMouseWheelFF(e)
    {
        if (elapsedTime(lastMouseWheel) < 75 || painting) {
            return;
        }
        lastMouseWheel = getTime();

        if(e.detail < 0) 
        {
            onPreviousTool();
            return;
        }
        onNextTool();
    }

    function onMouseWheelSizeFF(e)
    {
        var size = $('#size-container');
        if(e.detail < 0) 
        {
            onSizeIncrease();
            size.toggleClass('settings-giggle');
            return;
        }
        onSizeDecrease();
        size.toggleClass('settings-giggle');
    }

    function onMouseDown(e)
    {
        var ctx = layers.selected.getContext('2d');
        var ctxSym = layers.sym.getContext('2d');

        switch(currentTool)
        {
            case 0:
            case 1:
                ctx.beginPath();
                ctx.moveTo(mouse.x, mouse.y);
                $('#mouse').bind('mousemove', onPaint);

                if (symmetry)
                {
                    ctxSym.beginPath();
                    if (symmetry === 1) {
                        ctxSym.moveTo(mouse.x, $(layers.sym).height() - mouse.y);
                    } else {
                        ctxSym.moveTo(($(layers.sym).width() - mouse.x), mouse.y);
                    }
                    $('#sym').bind('mousemove', onPaint);
                }
                break;
            case 2:
                onLineDraw(mouse.x, mouse.y);
                break;
            case 3:
                onRectangleDraw(mouse.x, mouse.y, false);
                break;
            case 4:
                onCircleDraw(mouse.x, mouse.y, false);
                break;
            case 5:
                onRectangleDraw(mouse.x, mouse.y, true);
                break;
            case 6:
                onCircleDraw(mouse.x, mouse.y, true);
                break;
        }
        painting = true;
    }

    function onNextTool()
    {
        tools.eq(currentTool).toggleClass('selected');
        tools.eq(currentTool).css({backgroundColor: 'black'});

        currentTool = (currentTool === toolsCount - 1) ? 0 : (currentTool + 1);
        tools.eq(currentTool).toggleClass('selected');

        if (toolColor !== 'black' && toolColor !== '#FFFFFF') {
            tools.eq(currentTool).css({backgroundColor: toolColor});   
        } 
        else {
            tools.eq(currentTool).css({backgroundColor: '#5bc0de'});
        }
        onToolChange();
    }

    function onPreviousTool()
    {
        tools.eq(currentTool).toggleClass('selected');
        tools.eq(currentTool).css({backgroundColor: 'black'});

        currentTool = (currentTool === 0) ? (toolsCount - 1) : (currentTool - 1);
        tools.eq(currentTool).toggleClass('selected');

        if (toolColor !== 'black' && toolColor !== '#FFFFFF') {
            tools.eq(currentTool).css({backgroundColor: toolColor});   
        } 
        else {
            tools.eq(currentTool).css({backgroundColor: '#5bc0de'});
        }
        onToolChange();
    }

    function onLineDraw(x, y)
    {
        var ctx = layers.selected.getContext('2d');
        var ctxSym = layers.sym.getContext('2d');
        var before = ctx.getImageData(0, 0, layers.selected.width, layers.selected.height);
        var beforeSym = ctxSym.getImageData(0, 0, layers.sym.width, layers.sym.height);

        $('#mouse').bind('mousemove', lineMove);
        $('#mouse').bind('mouseup', lineMouseUp);

        function lineMove()
        {
            if (symmetry) {
                ctxSym.putImageData(beforeSym, 0, 0);
                ctxSym.beginPath();

                if (symmetry == 1) {
                    ctxSym.moveTo(x, $(layers.sym).height() - y);
                    ctxSym.lineTo(mouse.x, $(layers.sym).height() - mouse.y);
                } else {
                    ctxSym.moveTo($(layers.sym).width() - x, y);
                    ctxSym.lineTo($(layers.sym).width() - mouse.x, mouse.y);
                }
                ctxSym.stroke();  
            }
            ctx.putImageData(before, 0, 0);
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();  
        }

        function lineMouseUp()
        {
            $('#mouse').unbind('mousemove', lineMove);
            $('#mouse').unbind('mouseup', lineMouseUp);
        }
    }

    function onRectangleDraw(x, y, fill)
    {
        var ctx = layers.selected.getContext('2d');
        var ctxSym = layers.sym.getContext('2d');
        var before = ctx.getImageData(0, 0, layers.selected.width, layers.selected.height);
        var beforeSym = ctxSym.getImageData(0, 0, layers.sym.width, layers.sym.height);
        $('#mouse').bind('mousemove', rectMove);
        $('#mouse').bind('mouseup', rectMouseUp);

        function rectMove()
        {
            var rectX, rectY, width, height;
            if (symmetry) {
                if (symmetry === 1) {
                    rectY = (($(layers.sym).height() - y) - ($(layers.sym).height() - mouse.y) < 0) ? $(layers.sym).height() - y : $(layers.sym).height() - mouse.y;
                    rectX = (x - mouse.x < 0) ? x : mouse.x;
                } else {
                    rectY = (y - mouse.y < 0) ? y : mouse.y;
                    rectX = (($(layers.sym).width() - x) - ($(layers.sym).width() - mouse.x) < 0) ? ($(layers.sym).width() - x) : ($(layers.sym).width() - mouse.x);
                }
                width = Math.abs(x - mouse.x);
                height = Math.abs(y - mouse.y);

                ctxSym.putImageData(beforeSym, 0, 0);
                ctxSym.beginPath();
                ctxSym.rect(rectX, rectY, width, height);
                
                if (fill) {
                    ctxSym.fillStyle = toolColor;
                    ctxSym.fill();
                } else {
                    ctxSym.stroke(); 
                }
            }
            rectX = (x - mouse.x < 0) ? x : mouse.x;
            rectY = (y - mouse.y < 0) ? y : mouse.y;
            width = Math.abs(x - mouse.x);
            height = Math.abs(y - mouse.y);
            ctx.putImageData(before, 0, 0);
            ctx.beginPath();
            ctx.rect(rectX, rectY, width, height);
            
            if (fill) {
                ctx.fillStyle = toolColor;
                ctx.fill();
                return;
            }
            ctx.stroke();
        }

        function rectMouseUp()
        {
            $('#mouse').unbind('mousemove', rectMove);
            $('#mouse').unbind('mouseup', rectMouseUp);
        }
    }

    function onCircleDraw(x, y, fill)
    {
        var ctx = layers.selected.getContext('2d');
        var ctxSym = layers.sym.getContext('2d');
        var before = ctx.getImageData(0, 0, layers.selected.width, layers.selected.height);
        if (symmetry) {
            var beforeSym = ctxSym.getImageData(0, 0, layers.sym.width, layers.sym.height);
        }

        $('#mouse').bind('mousemove', circleMove);
        $('#mouse').bind('mouseup', circleMouseUp);

        function circleMove()
        {
            var radius = Math.sqrt(Math.pow(x - mouse.x, 2) + Math.pow(y - mouse.y, 2));
            if (symmetry) {
                ctxSym.putImageData(beforeSym, 0, 0);
                ctxSym.beginPath();
                
                if (symmetry === 1) {
                    ctxSym.arc(x, $(layers.sym).height() - y, radius, 0, 2 * Math.PI);
                } else {
                    ctxSym.arc($(layers.sym).width() - x, y, radius, 0, 2 * Math.PI);
                }

                if (fill) {
                    ctxSym.fillStyle = toolColor;
                    ctxSym.fill();
                } else {
                    ctxSym.stroke();
                }
            }
            ctx.putImageData(before, 0, 0);
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI);

            if (fill) {
                ctx.fillStyle = toolColor;
                ctx.lineWidth = 1;
                ctx.fill();
            }
            ctx.stroke();
            ctx.lineWidth = toolSize;
        }

        function circleMouseUp()
        {
            $('#mouse').unbind('mousemove', circleMove);
            $('#mouse').unbind('mouseup', circleMouseUp);
        }
    }

    function onMouseUp(e)
    {
        $('#mouse').unbind('mousemove', onPaint);
        painting = false;

        var ctx;

        if (symmetry) {
            ctx = layers.selected.getContext('2d');
            ctx.drawImage(layers.sym, 0, 0, $(layers.sym).width(), $(layers.sym).height());

            ctx = layers.sym.getContext('2d');
            ctx.clearRect(0, 0, layers.sym.width, layers.sym.height);
        }
        var preview = layers.preview[layers.current];
        ctx = preview.getContext('2d');
        ctx.drawImage(layers.selected, 0, 0, preview.width, preview.height);
    }

    function onMouseMove(e)
    {
        mouse.x = e.pageX - $('#mypaint-container')[0].offsetLeft;
        mouse.y = e.pageY - $('#mypaint-container')[0].offsetTop;
    }

    function onPaint() 
    {
        var ctx;

        if (symmetry) {
            ctx = layers.sym.getContext('2d');

            if (symmetry === 1) {
                ctx.lineTo(mouse.x, ($(layers.sym).height() - mouse.y));
            } else {
                ctx.lineTo(($(layers.sym).width() - mouse.x), mouse.y);
            }
            ctx.stroke();
        }
        ctx = layers.selected.getContext('2d');
        ctx.lineTo(mouse.x, mouse.y);
        ctx.stroke();
    }

    function onToolChange()
    {
        var ctx, i;
        switch(currentTool)
        {
            case 1:
                setLineWidth(toolSize);
                for (i = 0; i < layers.all.length; i++) {
                    ctx = layers.all[i].getContext('2d');
                    ctx.globalCompositeOperation = "destination-out";
                }
                ctx = layers.sym.getContext('2d');
                ctx.globalCompositeOperation = "destination-out";
                break;
            default:
                setLineWidth(toolSize);
                setColor(toolColor);
                for (i = 0; i < layers.all.length; i++) {
                    ctx = layers.all[i].getContext('2d');
                    ctx.globalCompositeOperation = "source-over";
                }
                ctx = layers.sym.getContext('2d');
                ctx.globalCompositeOperation = "source-over";
                break;
        }
        origin = null;
    }


    function onButtonClick()
    {
        var clickedTool = $(this).index('#tools button');

        if (clickedTool === currentTool) {
            return;
        }
        var curtool = tools.eq(currentTool);
        var newtool = tools.eq(clickedTool);
        
        curtool.toggleClass('selected');
        curtool.css({backgroundColor: 'black'});
        newtool.toggleClass('selected');

        if (toolColor !== '#ffffff' && toolColor !== 'black') {
            newtool.css({backgroundColor: toolColor});
            $('#tools').css({borderRightColor: toolColor});
        }
        else
        {
            newtool.css({backgroundColor: '#5bc0de'});
            $('#tools').css({borderRightColor: '#5bc0de'});   
        }
        currentTool = clickedTool;
        onToolChange();
    }

    function onResize()
    {
        updateCanvasSize();
        setLineWidth(toolSize);
        
        var color = (currentTool === 1) ? 'white' : toolColor;
        setColor(color);
    }

    function onSettingsClick()
    {
        if (elapsedTime(lastSettingsClick) < 500) {
            return;
        }
        lastSettingsClick = getTime();

        var settings = $('#settings');

        settings.toggleClass('settings-hide');
    }

    function onSettingsMouseEnter()
    {
        if (painting) {
            return;
        }
        var settings = $('#settings');
        var btn = $('#btn-settings');
        var icon = $('#settings-icon');
        settings.removeClass('settings-hide');
        btn.addClass('settings-rotate');
        icon.addClass('animated rollIn');

    }

    function onSettingsMouseLeave()
    {
        if (painting) {
            return;
        }
        var settings = $('#settings');
        var btn = $('#btn-settings');
        var icon = $('#settings-icon');
        settings.addClass('settings-hide');
        btn.removeClass('settings-rotate');
        icon.removeClass('animated rollIn');
    }

    function onSizeIncrease()
    {
        if (toolSize >= 72) {
            return;
        }
        toolSize++;
        setLineWidth(toolSize);
        
    }

    function onSizeDecrease()
    {
        if (toolSize <= 1) {
            return;
        }
        toolSize--;
        setLineWidth(toolSize);
    }

    function onSizeChange()
    {
        var size = $(this).val();

        if (size < 1 || size > 72) {
            return;
        }
        toolSize = size;
        setLineWidth(toolSize);
    }

    function onOpen()
    {
        $('#file-input').trigger('click');
    }

    function onSave()
    {
        var ctxMain = layers.main.getContext('2d');

        for (var i=0; i < layers.count; i++) {
            ctxMain.drawImage(layers.all[i], 0, 0);
        }

        var data = layers.main.toDataURL('image/png');
        
        this.href = data;
    }

    function onColorChange()
    {
        toolColor = $(this).val();
        setColor(toolColor);

        $('#color-input').val(toolColor);
        if (toolColor !== '#FFFFFF') {
            $('button.selected').css({backgroundColor: toolColor});
            $('#tools').css({borderRightColor: toolColor});
            $('#settings-icon').css({color: toolColor});
            $('#size-plus, #size-less').css({backgroundColor: toolColor});
            $('#layers-new').css({backgroundColor: toolColor});
            $('#layers-selector').css({border: '3px solid ' + toolColor});
            return;
        }
        $('button.selected').css({backgroundColor: '#5bc0de'});
        $('#tools').css({borderRightColor: '#5bc0de'});
        $('#settings-icon').css({color: '#5bc0de'});
        $('#size-plus, #size-less').css({backgroundColor: '#5bc0de'});
        $('#layers-new').css({backgroundColor: '#5bc0de'});
        $('#layers-selector').css({border: '3px solid ' + '#5bc0de'});

    }

    function onMoreColors()
    {
         $('#color-picker').trigger('click');
    }

    function onSelectColor()
    {
        toolColor = $(this).val();
        setColor(toolColor);
        $('#color-input').val(toolColor);

        if (toolColor !== '#ffffff') {
            $('button.selected').css({backgroundColor: toolColor});
            $('#tools').css({borderRightColor: toolColor});
            return;
        }
        $('button.selected').css({backgroundColor: '#5bc0de'});
        $('#tools').css({borderRightColor: '#5bc0de'});
    }

    function onFileSelect()
    {   
        var ctx = layers.selected.getContext('2d');
        var fileReader = new FileReader();

        if (this.files[0].type.split('/')[0] !== 'image') {
            return alert('Ce format n\'est pas pris en charge.');
        }

        fileReader.readAsDataURL(this.files[0]);

        fileReader.onload = function()
        {
            var img = new Image();
            img.src = fileReader.result;
            
            img.onload = function()
            {
                ctx.drawImage(img, 0, 0);
                reloadLayerManager();
            };
        };
    }

    function onInputColorChange()
    {
        var color = $(this).val();
        color = (!isValidColor(color)) ? '#' + color : color;
        if (!isValidColor(color)) {
            $(this).val('');
            return;
        }

        toolColor = color;
        setColor(toolColor);

        $('#color-input').val(toolColor);

        if (toolColor.toLowerCase() !== '#ffffff') {
            $('button.selected').css({backgroundColor: toolColor});
            $('#tools').css({borderRightColor: toolColor});
            return;
        }
        $('button.selected').css({backgroundColor: '#5bc0de'});
        $('#tools').css({borderRightColor: '#5bc0de'});
    }

    function onSymmetryChange()
    {   
        symmetry++;
        if (symmetry > 2) {
            symmetry = 0;
        }
        onSymmetryChangeUI(symmetry);
    }

    function onFileDrop(e)
    {
        e.stopPropagation();
        e.preventDefault();

        var files = e.originalEvent.target.files || e.originalEvent.dataTransfer.files;

        if (files[0].type.split('/')[0] !== 'image') {
            return alert('Ce format n\'est pas pris en charge.');
        }

        var ctx = layers.selected.getContext('2d');
        var reader = new FileReader();
        reader.readAsDataURL(files[0]);
        
        reader.onload = function(e) 
        {
            var img = new Image();
            img.src = reader.result;
            
            img.onload = function()
            {
                ctx.drawImage(img, 0, 0);
                reloadLayerManager();
            };
        };
        return false;
    }

    function onShowLayers()
    {
        $(this).toggleClass('layers-hide');
        $('#layers-p').fadeOut();
    }

    function onHideLayers()
    {
        $(this).toggleClass('layers-hide');
        $('#layers-p').fadeIn();
    }

    function onLayerSlotClick(e)
    {
        //e.stopPropagation();

        var current = $(this).index();
        if (current >= layers.count) {
            return;
        }

        var pos = $(this).position();

        layers.current = current;
        layers.selected = layers.all[current];
        
        $('#layers-selector').css({left: pos.left + 3});

        setLineWidth(toolSize);
        setColor(toolColor);
    }

    function onNewLayer()
    {
        addNewLayer(layers);

        var slot = $('.layers-slot')[layers.count - 1];
        $(slot).children('.layers-mask').css({backgroundColor: '#5bc0de'});

    }

    function onLayerDelete(e)
    {
        e.stopPropagation();

        var index = $(this).index('.layers-delete');

        console.log(index);

        if (index === 0) {
            return;
        }

        layers.current = 0;
        layers.selected = layers.all[0];

        console.log(layers.count);

        selectLayer(0);

        $('.layers').eq(index).remove();

        layers.count = $('.layers').length;
        layers.all = $('.layers');
        
        reloadLayerManager();
    }

    function onMouseDownLayerSlot()
    {
        var index = $(this).index();

        if (index >= layers.count || index === 0) {
            return;
        }

        layers.dragDrop[0] = index;

        var pos = $(this).position();

        $('#layers-move').css({left: pos.left + 3});
    }

    function onMouseUpLayerSlot()
    {
        var from = layers.dragDrop[0];
        var to = layers.dragDrop[1];
        var current = $(this).index();

        if (from && to && from !== to 
            && from < layers.count && to < layers.count
            && from !== 0 && to !== 0) {
            layerSwap(from, to);
            layers.all = $('.layers');
            layers.current = current;
            layers.selected = layers.all[current];
            selectLayer(current);
        }
        $('#layers-move').fadeOut();
        layers.dragDrop = [null, null];
    }

    function onMouseEnterLayerSlot()
    {
        var index = $(this).index();
        if (layers.dragDrop[0] === null || index >= layers.count || index === 0) {
            return;
        }
        var pos = $(this).position();
        
        $('#layers-move').fadeIn();
        $('#layers-move').css({left: pos.left + 3});

        layers.dragDrop[1] = index;
    }

    function onMouseLeaveLayerManager()
    {
        layers.dragDrop = [null, null];
        $('#layers-move').fadeOut();
    }

    function onLayerHide(e)
    {
        e.stopPropagation();
        var index = $(this).parent('.layers-slot').index();

        console.log(index);
        layers.all.eq(index).toggle();

        if (layers.all.eq(index).is(':visible')) {
            $(this).css({backgroundColor: '#5bc0de'});
        } else {
            $(this).css({backgroundColor: '#696969'});
        }
    }


    updateCanvasSize();
    resetContext();

    $(window).resize(onResize);
    $('#mouse').bind('mousewheel', onMouseWheel);
    $('#mouse').bind('mousedown', onMouseDown);
    $('#mouse').bind('mouseup', onMouseUp);
    $('#mouse').bind('mousemove', onMouseMove);
    $('#tools button').click(onButtonClick);
    $('#btn-settings').click(onSettingsClick);
    $('#settings').mouseleave(onSettingsMouseLeave);
    $('#settings').mouseenter(onSettingsMouseEnter);
    $('#size-plus').click(onSizeIncrease);
    $('#size-less').click(onSizeDecrease);
    $('#size').change(onSizeChange);
    $('#settings-open').click(onOpen);
    $('#settings-save').click(onSave);
    $('#more-colors').click(onMoreColors);
    $('#color-picker').change(onSelectColor);
    $('#settings .settings-color').click(onColorChange);
    $('#size-container').bind('mousewheel', onMouseWheelSize);
    $('#file-input').change(onFileSelect);
    $('#mypaint-container').bind('DOMMouseScroll', onMouseWheelFF);
    $('#size-container').bind('DOMMouseScroll', onMouseWheelSizeFF);
    $('#color-input').change(onInputColorChange);
    $('#settings-sym').click(onSymmetryChange);
    $('#layers').mouseenter(onShowLayers);
    $('#layers').mouseleave(onHideLayers);

    $('.layers-slot').click(onLayerSlotClick);
    $('.layers-slot').mousedown(onMouseDownLayerSlot);
    $('.layers-slot').mouseup(onMouseUpLayerSlot);
    $('.layers-slot').mouseenter(onMouseEnterLayerSlot);
    $('#layers-move').mouseup(onMouseUpLayerSlot);
    $('#layers').mouseleave(onMouseLeaveLayerManager);
    $('#layers').mouseup(onMouseLeaveLayerManager);
    $('.layers-mask').click(onLayerHide);

    $('#layers-new').click(onNewLayer);
    $('.layers-delete').click(onLayerDelete);
    $('html').on('drop', onFileDrop);
    $("html").on("dragover", function(event) 
    {
        event.preventDefault();  
        event.stopPropagation();
    });
    $("html").on("dragleave", function(event) 
    {
        event.preventDefault();  
        event.stopPropagation();
    });
}


/* UI Animation */
function onSymmetryChangeUI(symmetry)
{
    var params = ['aucune', 'horizontale', 'verticale'];
    var span = $('#settings-sym span');
    var settings = $('#settings-sym');

    span.remove();
    settings.append('<span></span>');
    span = $('#settings-sym span');

    span.addClass('animated flipInY');
    span.html(params[symmetry]);

    switch (symmetry) {
        case 0:
            $('#separator-v').fadeOut();
            break;
        case 1:
            $('#separator-h').fadeIn();
            break;
        case 2:
            $('#separator-h').fadeOut();
            $('#separator-v').fadeIn();
            break;
    }
}

/*  */


function reloadLayerManager()
{
    var previews = $('#layers canvas');
    
    $('.layers-slot').each(function()
    {
        var index = $(this).index('.layers-slot');
        var preview = $(this).children('canvas');
        var del = $(this).children('.layers-delete');
        var hide = $(this).children('.layers-mask');

        if (index === 0) {
            return;
        }

        preview.css({transform: 'scale(0,0)'});
        del.css({transform: 'scale(0,0)'});
        hide.css({transform: 'scale(0,0)'});

        var ctx = preview[0].getContext('2d');
        ctx.clearRect(0, 0, preview[0].width, preview[0].height);

    });

    $('.layers').each(function()
    {
        var index = $(this).index('.layers');
        var ctx = previews[index].getContext('2d');

        ctx.drawImage(this, 0, 0, previews[index].width, previews[index].height);

        if (index === 0) {
            return;
        }
        var hide = $('.layers-mask').eq(index);

        $(previews[index]).css({transform: 'scale(1,1)'});
        $('.layers-delete').eq(index).css({transform: 'scale(1,1)'});
        hide.css({transform: 'scale(1,1)'});
        
        if($(this).is(':visible')) {
            hide.css({backgroundColor: '#5bc0de'});
        } else {
            hide.css({backgroundColor: '#696969'});
        }

    });

}

function layerSwap(from, to)
{
    var layers = $('.layers');
    
    var swap1 = layers.eq(from);
    var swap2 = layers.eq(to);

    $("<div id='swap1'>").insertAfter(swap1);
    $("<div id='swap2'>").insertAfter(swap2);

    swap1 = swap1.detach();
    swap2 = swap2.detach();

    swap2.insertAfter($('#swap1'));
    swap1.insertAfter($('#swap2'));

    $('#swap1, #swap2').remove();

    reloadLayerManager();
}

function selectLayer(index)
{
    var pos = $($('.layers-slot')[index]).position();
    $('#layers-selector').css({left: pos.left + 3});
}

function addNewLayer(layers)
{
    if (layers.count === 8) {
        return alert('Vous ne pouvez pas créer plus de 8 calques.');
    }
    $('.layers').last().after('<canvas class=\'layers\'></canvas>');

    layers.count++;
    layers.all = $('.layers');

    var layer = $('.layers').last()[0];
    var container = $('#mypaint-container');

    layer.width = container.width();
    layer.height = container.height();

    var preview = layers.preview[layers.count - 1];
    var ctx = preview.getContext('2d');

    ctx.drawImage(layer, 0, 0, preview.width, preview.height);

    $(preview).css({transform: 'scale(1, 1)'});

    var slot = $('.layers-slot')[layers.count - 1];
    $(slot).children('.layers-delete').css({transform: 'scale(1, 1)'});
    $(slot).children('.layers-mask').css({transform: 'scale(1,1)'});
}

function initLayerManager(layers)
{
    var main = layers.main;
    var preview = layers.preview[0];
    var ctx = preview.getContext('2d');

    ctx.drawImage(main, 0, 0, preview.width, preview.height);

    $(preview).css({transform: 'scale(1, 1)'});
}

function resetContext()
{
    var canvas = $('#mypaint-container canvas');

    for (var i = 0; i < canvas.length; i++) {
        var ctx = canvas[i].getContext('2d');
        ctx.lineWidth = 5;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'black';
    }
}

function setLineWidth(width)
{
    var canvas = $('#mypaint-container canvas');

    for (var i = 0; i < canvas.length; i++) {
        var ctx = canvas[i].getContext('2d');
        ctx.lineWidth = width;
    }
    $('#size').val(width);
}

function setColor(color)
{
    var canvas = $('#mypaint-container canvas');

    for (var i = 0; i < canvas.length; i++)
    {
        var ctx = canvas[i].getContext('2d');
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
    }
}

function updateCanvasSize()
{
    var container = $('#mypaint-container');
    var canvas = $('#mypaint-container canvas');
    var images = [];

    canvas.each(function()
    {
        var ctx = this.getContext('2d');
        images.push(ctx.getImageData(0, 0, this.width, this.height));
    });
    container.children().each(function()
    {
        this.width = container.width();
        this.height = container.height();
        $(this).width(container.width());
        $(this).height(container.height());
    });
    canvas.each(function()
    {
        var ctx = this.getContext('2d');
        ctx.putImageData(images[$(this).index()], 0 , 0);
    });
}

function elapsedTime(since)
{
    return getTime() - since;
}

function getTime()
{
    return (new Date()).getTime();
}

function isValidColor(color)
{
    if (color === '' || color === 'inherit' || color === 'transparent')
        return false;

    var image = document.createElement('img');
    image.style.color = 'rgb(0, 0, 0)';
    image.style.color = color;
    if (image.style.color !== 'rgb(0, 0, 0)')
        return true;
    image.style.color = 'rgb(255, 255, 255)';
    image.style.color = color;
    return image.style.color !== 'rgb(255, 255, 255)';
}