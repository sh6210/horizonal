/**
 * This is the main method that converts the document to a collection of pages. Since this method can be slow (depending
 * on the number of DOM elements in the document), it runs async and returns a promise.
 * @param currentScroll
 */
function composePage(currentScroll) {
    var start = new Date().getTime(); // profiling performance for optimization

    var deferred = new $.Deferred();
    ROOT = $(OPTIONS.rootElement);
    var fragment = createDocumentFragment();
    CONTAINER = $(fragment.querySelector('#hrz-container'));
    CONTAINER.css('display', 'none'); // setting display:none considerably speeds up rendering

    VIEWPORT_HEIGHT = $(window).height() - OPTIONS.pageMargin * 2;

    displayLoadingIndicator().then(function() {
        // a setTimeout is used to force async execution and allow the loadingIndicator to display before the
        // heavy computations of composePage() are begun.
        setTimeout(function() {
            var allNodes = new NodeCollection(OPTIONS.selector);

            PAGE_COLLECTION = pageCollectionGenerator.fromNodeCollection(allNodes);
            PAGE_COLLECTION.appendToDom(currentScroll);

            // remove any DOM nodes that are not included in the selector,
            // since they will just be left floating around in the wrong place.
            CONTAINER.children().not('.hrz-page').filter(':visible').remove();
            ROOT.empty().append(fragment);

            PAGE_COLLECTION.forEach(function(page) {
                page.nodes.forEach(function(node) {
                   node.renderStyles(page);
                });
            });

            CONTAINER.css('display', '');

            console.log('style loop called: ' + window.called);

            var documentHeight = PAGE_COLLECTION.last().bottom / OPTIONS.scrollbarShortenRatio + VIEWPORT_HEIGHT;
            ROOT.height(documentHeight);
            if (!OPTIONS.displayScrollbar) {
                $('body').css('overflow-y', 'hidden');
            }
            renderPageCount();
            removeLoadingIndicator();
            deferred.resolve();

            var end = new Date().getTime();
            console.log('Time to execute composePage(): ' + (end - start));
        }, 0);
    });

    return deferred.promise();
}

/**
 * Building up a documentFragment and then appending it all at once to the DOM
 * is done to improve performance.
 * @returns {*}
 */
function createDocumentFragment() {
    var fragment = document.createDocumentFragment();
    var containerDiv = document.createElement('div');
    containerDiv.id = 'hrz-container';
    fragment.appendChild(containerDiv);
    return fragment;
}

function displayLoadingIndicator() {
    var deferred = new $.Deferred();
    if ($('#loadingIndicator').length === 0) {
        $('body').append('<div id="loadingIndicator" style="display:none;"><p class="loading">Loading...</p></div>');
        $('#loadingIndicator').fadeIn(50, function() {
            deferred.resolve();
        });
    }
    return deferred.promise();
}

function removeLoadingIndicator() {
    setTimeout(function() {
        $('#loadingIndicator').fadeOut(50, function() {
            $(this).remove();
        });
    }, 300);
}

function renderPageCount() {
    if ($('.hrz-page-count').length === 0) {
        var pageCountDiv = $('<div class="hrz-page-count"></div>');
        $('body').append(pageCountDiv);
        pageCountDiv.append('<span id="hrz-current-page"></span> / <span id="hrz-total-pages"></span>');
        $('#hrz-total-pages').html(PAGE_COLLECTION.length);
        if (!OPTIONS.displayPageCount) {
            pageCountDiv.addClass('hidden');
        }
    }
}

function removePageCount() {
    $('.hrz-page-count').remove();
}

function updatePageCount() {
    $('#hrz-current-page').html(PAGE_COLLECTION.currentPage);
}

/**
 * + Jonas Raoni Soares Silva
 * @ http://jsfromhell.com/array/shuffle [v1.0]
 * @param o
 * @returns {*}
 */
function shuffle(o){
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
}

function noop() {}