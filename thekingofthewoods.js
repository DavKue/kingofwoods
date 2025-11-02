/**
 *------
 * BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
 * TheKingOfTheWoods implementation : © <David Kühn> <david@schusterfilm.de>
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 *
 * thekingofthewoods.js
 *
 * TheKingOfTheWoods user interface script
 * 
 * In this file, you are describing the logic of your user interface, in Javascript language.
 *
 */

define([
    "dojo","dojo/_base/declare",
    "ebg/core/gamegui",
    "ebg/counter",
    "ebg/stock"
],
function (dojo, declare) {
    return declare("bgagame.thekingofthewoods", ebg.core.gamegui, {
        constructor: function(){
            console.log('thekingofthewoods constructor');
              
            // Here, you can init the global variables of your user interface
            // Example:
            // this.myGlobalValue = 0;

            this.playerStocks = {}; // Stores stocks for each player { playerId: { hand, court } }
            this.cardTypeMap = {
                'Assassin': 1,
                'Trader': 2,
                'Guard': 3,
                'Squire': 4,
                'Scholar': 5,
                'Priest': 6,
                'Jester': 7,
                'Treasurer': 8,
                'Knight': 9,
                'General': 10,
                'Princess': 11,
                'Backside': 12
            };
            this.slideDuration = 500;
            this.selectedCardId = null;
            this.selectedAssassin = 0;

            this.cardScale = 0.20; // Start with 30% size
            this.baseCardWidth = 768;
            this.baseCardHeight = 1181;
            this.baseSpriteWidth = 3072;
            this.baseSpriteHeight = 3543;
            this.scaledCardWidth = this.baseCardWidth * this.cardScale;
            this.scaledCardHeight = this.baseCardHeight * this.cardScale;
            this.scaledSpriteWidth = this.baseSpriteWidth * this.cardScale;
            this.scaledSpriteHeight = this.baseSpriteHeight * this.cardScale;

            setInterval(() => this.assassinSyncPositions(), 1000);
        },
        
        /*
            setup:
            
            This method must set up the game user interface according to current game situation specified
            in parameters.
            
            The method is called each time the game interface is displayed to a player, ie:
            _ when the game starts
            _ when a player refreshes the game page (F5)
            
            "gamedatas" argument contains all datas retrieved by your "getAllDatas" PHP method.
        */
        
        setup: function( gamedatas )
        {
            console.log( "Starting game setup" );

            // // Example to add a div on the game area
            // document.getElementById('game_play_area').insertAdjacentHTML('beforeend', `
            //     <div id="player-tables"></div>
            // `);
            
            // // Setting up player boards
            // Object.values(gamedatas.players).forEach(player => {
            //     // example of setting up players boards
            //     this.getPlayerPanelElement(player.id).insertAdjacentHTML('beforeend', `
            //         <div id="player-counter-${player.id}">A player counter</div>
            //     `);

            //     // example of adding a div for each player
            //     document.getElementById('player-tables').insertAdjacentHTML('beforeend', `
            //         <div id="player-table-${player.id}">
            //             <strong>${player.name}</strong>
            //             <div>Player zone content goes here</div>
            //         </div>
            //     `);
            // });
            
            // Create main game containers
            document.getElementById('game_play_area').insertAdjacentHTML('beforeend', `
                <div id="player-tables"></div>
            `);

            // Initialize all player stocks
            this.initializePlayerStocks(gamedatas.players);
            
            // Load initial card positions
            this.updateCardDisplay(gamedatas.cards);


            // Setup game notifications to handle (see "setupNotifications" method below)
            this.setupNotifications();

            this.gamedatas.assassins = this.gamedatas.assassins || {};

            //Setup Player Panels for Round-Scores
            this.updatePlayerPanels();

            //Setup Amount of Cards-info
            this.updateGlobalCardCounts(); 

            //Show Round Popup if needed
            if (this.gamedatas.showPopup == true) {
                this.showRoundPopup(this.gamedatas.currentRound); 
            }

            console.log( "Ending game setup" );
        },
       

        ///////////////////////////////////////////////////
        //// Game & client states
        
        // onEnteringState: this method is called each time we are entering into a new game state.
        //                  You can use this method to perform some user interface changes at this moment.
        //
        onEnteringState: function( stateName, args )
        {
            console.log( 'Entering state: '+stateName, args );
            
            switch( stateName )
            {
            
            /* Example:
            
            case 'myGameState':
            
                // Show some HTML block at this game state
                dojo.style( 'my_html_block_id', 'display', 'block' );
                
                break;
           */
           
           
            case 'dummy':
                break;
            }
        },

        // onLeavingState: this method is called each time we are leaving a game state.
        //                 You can use this method to perform some user interface changes at this moment.
        //
        onLeavingState: function( stateName )
        {
            console.log( 'Leaving state: '+stateName );
            
            switch( stateName )
            {
            
            /* Example:
            
            case 'myGameState':
            
                // Hide the HTML block we are displaying only during this game state
                dojo.style( 'my_html_block_id', 'display', 'none' );
                
                break;
           */
           
           
            case 'dummy':
                break;
            }               
        }, 

        // onUpdateActionButtons: in this method you can manage "action buttons" that are displayed in the
        //                        action status bar (ie: the HTML links in the status bar).
        //        
        onUpdateActionButtons: function( stateName, args )
        {
            console.log( 'onUpdateActionButtons: '+stateName, args );
                    
            // Clear previous actions
            this.statusBar.removeActionButtons()

            if( this.isCurrentPlayerActive() )
            {            
                switch( stateName )
                {
                 case 'playerTurn':    
                    break;
                }
            }
        },        

        ///////////////////////////////////////////////////
        //// Utility methods
        
        /*
        
            Here, you can defines some utility methods that you can use everywhere in your javascript
            script.
        
        */


        updatePlayerPanels: function () {
            Object.values(this.gamedatas.players).forEach(player => {
                const infoDiv = this.getPlayerPanelElement(player.id);
                if (!infoDiv) return;

                let content = '';
                switch(this.gamedatas.roundsMode) {
                    case 2:
                        content += _("Points from prior rounds: ${points}/42").replace('${points}', player.rounds_before_points);
                        break;
                    case 3:
                        content += _("Rounds won: ${won}/2").replace('${won}', player.rounds_won);
                        break;
                    case 4:
                        content += _("Rounds won: ${won}/3").replace('${won}', player.rounds_won);
                        break;
                    default:
                        content = '';
                }

                // Count cards in hand for this player
                const handCardCount = Object.values(this.gamedatas.cards).filter(card =>
                    card.card_owner === player.id && card.card_location === 'hand'
                ).length;

                // Add Hands
                content += `<br>` + _("Hand: <b>${cards} cards</b>").replace('${cards}', handCardCount);

                // Set the final HTML
                infoDiv.innerHTML = content;
            });
        },

        updateGlobalCardCounts: function() {
            const cardInformation = this.cardInformation();
            // Generate HTML
            amountAside = 0;
            const content = this.gamedatas.cardsInPlay.map((card) => {
                const [type, count] = Object.entries(card)[0];
                if (type != 'aside') {
                const name = cardInformation[type].name;
                return `
                    <div>
                        <span>${count}x</span>
                        <span>${name}</span>
                    </div>
                `;
                } else {
                    amountAside = count;
                }
            }).join('');
        
            const playerBoardsContainer = $('player_boards');
            if (playerBoardsContainer) {
                const infoPanel = document.createElement('div');
                infoPanel.className = 'player-board roundedbox kotw-global-info';
                
                // Add header and content container
                infoPanel.innerHTML = `
                    <div class="playerpaneltext">
                        <div>${_("Cards in this set:")}</div>
                        <div>${content}</div>
                        <div>${_("Cards put aside:")} ${amountAside}</div>
                    </div>
                `;
                
                // First remove existing panel if it exists
                const existingPanel = playerBoardsContainer.querySelector('.kotw-global-info');
                if (existingPanel) existingPanel.remove();
                
                // Insert at the top of player boards
                playerBoardsContainer.appendChild(infoPanel, playerBoardsContainer.firstChild);
            }
        },

        initializePlayerStocks: function(players) {
            const playerTables = document.getElementById('player-tables');
            playerTables.innerHTML = '';
        
            // Sort Players
            const playerOrder = this.gamedatas.playerorder;
            const allPlayers = Object.values(players);
            const orderedIdsSet = new Set(playerOrder.map(String));
            const orderedPlayers = playerOrder
                .map(playerId => allPlayers.find(p => p.id == playerId))
                .filter(p => p); // filter out any undefined, in case of missing IDs
            const missingPlayers = allPlayers.filter(p => !orderedIdsSet.has(p.id));
            const finalPlayerOrder = [...orderedPlayers, ...missingPlayers];
            const textHand = _('Hand');
            const textCourt = _('Court');

            Object.values(finalPlayerOrder).forEach(player => {
                const isCurrentPlayer = player.id == this.player_id;
                // Create player area
                const playerDiv = document.createElement('div');
                playerDiv.className = 'player-area';
                playerDiv.innerHTML = `
                    <div class="player-header" style="color: #${player.color};">
                        <strong>${player.name}</strong>
                    </div>
                    <div class="player-zones">
                        <div class="zone hand-zone">
                            <div class="zone-label">${textHand}</div>
                            <div class="hand-container" id="hand-${player.id}"></div>
                        </div>
                        <div class="zone court-zone" id="court-zone-${player.id}">
                            <div class="zone-label">${textCourt}</div>
                            <div class="court-container" id="court-${player.id}"></div>
                        </div>
                    </div>
                `;
                playerTables.appendChild(playerDiv);

                // Initialize Hand Stock
                const handStock = new ebg.stock();
                handStock.create(this, $(`hand-${player.id}`), 768, 1181);
                if (isCurrentPlayer) {
                    handStock.horizontal_overlap  = 100;
                } else {
                    handStock.horizontal_overlap  = 22;
                }

                this.configureStock(handStock);

                // Initialize Court Stock
                const courtStock = new ebg.stock();
                courtStock.create(this, $(`court-${player.id}`), 768, 1181);
                this.configureStock(courtStock);

                // Store references
                this.playerStocks[player.id] = { hand: handStock, court: courtStock };
            });
        },

        cardInformation: function () {
            cardInformation = {
                'Assassin': {
                    'type' : 1,
                    'name' : _('Assassin'),
                    'influence' : 0,
                    'text' : _("Cover 1 card at any court. If you cover another <b>Assassin</b>, discard both."),
                },
                'Trader': {
                    'type' : 2,
                    'name' : _('Trader'),
                    'influence' : 1,
                    'text' : _("<b>Intrigue:</b> Give this player facedown 1 card from your hand. They have to return 1 card with higher influence (or the highest)."),
                },
                'Guard': {
                    'type' : 3,
                    'name' : _('Guard'),
                    'influence' : 2,
                    'text' : _("At this court, an <b>Assassin</b> can only cover a <b>Guard</b>."),
                },
                'Squire': {
                    'type' : 4,
                    'name' : _('Squire'),
                    'influence' : 2,
                    'text' : _("If there is already a <b>Squire</b> at any court, you have to play this card. If another player‘s <b>Knight</b> steals a card from your hand, it has to be the <b>Squire</b>."),
                },
                'Scholar': {
                    'type' : 5,
                    'name' : _('Scholar'),
                    'influence' : 3,
                    'text' : _("<b>Intrigue:</b> Take a card with influence 4 or smaller (not the <b>Assassin</b> or the <b>Scholar</b>) from this court to your hand. If not possible, take a card with influence 5 or greater."),
                },
                'Priest': {
                    'type' : 6,
                    'name' : _('Priest'),
                    'influence' : 3,
                    'text' : _("You may put an additional card to the same court in order to take 1 card with lower influence from there to your hand (not the <b>Assassin</b> or the <b>Jester</b>)."),
                },
                'Jester': {
                    'type' : 7,
                    'name' : _('Jester'),
                    'influence' : 4,
                    'text' : _("A court with exactly <b>3 Jesters</b> has no influence at all."),
                },
                'Treasurer': {
                    'type' : 8,
                    'name' : _('Treasurer'),
                    'influence' : 4,
                    'text' : _("<b>Intrigue:</b> Draw 1 card from this player‘s hand."),
                },
                'Knight': {
                    'type' : 9,
                    'name' : _('Knight'),
                    'influence' : 5,
                    'text' : _("<b>Intrigue:</b> Look at this person‘s hand cards and take 1. If there is a <b>Squire</b> among the cards, you have to take him."),
                },
                'General': {
                    'type' : 10,
                    'name' : _('General'),
                    'influence' : 6,
                    'text' : _("<b>Intrigue:</b> Exchange your hand cards with this player."),
                },
                'Princess': {
                    'type' : 11,
                    'name' : _('Princess'),
                    'influence' : 7,
                    'text' : _("You can <b>only</b> play her if there are at least 3 uncovered cards at your court. The <b>Princess</b> always breaks ties in her favour."),
                },
                'Backside': {
                    'type' : 12,
                    'name' : _('Backside'),
                    'influence' : 0,
                    'text' : _("This is the backside of the card. What could be behind it?"),
                },
            };
            return cardInformation;
        },

        configureStock: function(stock) {
            stock.setSelectionAppearance('none');
            stock.image_items_per_row = 4;
            stock.item_image_url = g_gamethemeurl + 'img/KotW_Cards_Spreadsheet.jpg';
            
            // Resize stock items
            stock.resizeItems(
                this.scaledCardWidth,                   // Display width
                this.scaledCardHeight,                  // Display height
                this.scaledSpriteWidth,            // Original sprite width
                this.scaledSpriteHeight            // Original sprite height
            );


            // Add card types to each stock
            Object.entries(this.cardTypeMap).forEach(([name, typeId]) => {
                stock.addItemType(
                    typeId,
                    1, // Weight
                    stock.item_image_url,
                    typeId - 1 // Position index
                );
            });

            stock.setSelectionMode(1); // Allow single selection
            stock.setSelectionAppearance( 'class' );
            stock.ownerPlayerId = parseInt(stock.container_div.id.split('-')[1], 10);
            dojo.connect(stock, 'onChangeSelection', this, 'onCardSelection');

            cardInformation = this.cardInformation();
            stock.onItemCreate = (itemDiv, itemType, itemId) => {
                const cardType = Object.keys(this.cardTypeMap).find(
                    key => this.cardTypeMap[key] === itemType
                );
                
                if (cardType) {
                    textInfluence = _('Influence');
                    const tooltipHTML = `
                        <div class="card-tooltip">
                            <div class="tooltip-header">
                                <strong>${cardInformation[cardType].name}</strong>
                            </div>
                            <div class="tooltip-text">${textInfluence}: ${cardInformation[cardType].influence}</div>
                            <div class="tooltip-text">${cardInformation[cardType].text}</div>
                        </div>
                    `;
                    this.addTooltipHtml(itemDiv.id, tooltipHTML);

                    //add Card-Names
                    if (cardType != 'Backside') {
                        // Name
                        const nameDiv = document.createElement('div');
                        nameDiv.className = 'card-text';
                        nameDiv.innerHTML = cardInformation[cardType].name;
                        itemDiv.appendChild(nameDiv);

                        // Description
                        const descDiv = document.createElement('div');
                        descDiv.className = 'card-description';
                        descDiv.innerHTML = cardInformation[cardType].text;
                        itemDiv.appendChild(descDiv);

                        // Auto-size text
                        this.adjustTextSize(descDiv);
                    }

                }
            };

        },

        createCardElement: function(cardType, scale = 0.4, itemDivID) {
            const typeId = this.cardTypeMap[cardType];
            const cardInfo = this.cardInformation()[cardType];
            if (!typeId) return null;

            // Calculate dimensions based on scale
            const scaledWidth = this.baseCardWidth * scale;
            const scaledHeight = this.baseCardHeight * scale;
            const scaledSpriteWidth = this.baseSpriteWidth * scale;
            const scaledSpriteHeight = this.baseSpriteHeight * scale;

            // Calculate sprite position
            const itemsPerRow = 4;
            const index = typeId - 1;
            const col = index % itemsPerRow;
            const row = Math.floor(index / itemsPerRow);
            const xPercent = (col / (itemsPerRow - 1)) * 100;
            const yPercent = (row / 2) * 100; // 3 rows total (0-2)

            const cardDiv = document.createElement('div');
            cardDiv.className = 'tooltip-card';
            cardDiv.style.cssText = `
                width: ${scaledWidth}px;
                height: ${scaledHeight}px;
                background-image: url(${g_gamethemeurl}img/KotW_Cards_Spreadsheet.jpg);
                background-size: ${scaledSpriteWidth}px ${scaledSpriteHeight}px;
                background-position: ${xPercent}% ${yPercent}%;
            `;

            // Add text elements if not backside
            if (cardType !== 'Backside') {
                const textContainer = document.createElement('div');
                textContainer.className = 'tooltip-card-content';
                
                const nameDiv = document.createElement('div');
                nameDiv.className = 'card-text';
                nameDiv.innerHTML = cardInfo.name;
                
                const descDiv = document.createElement('div');

                const baseFontSize = Math.floor(14 * (scale / 0.20)); // Scale font size proportionally
                nameDiv.style.fontSize = `${baseFontSize}px`;
                descDiv.style.fontSize = `${baseFontSize - 2}px`;
                
                descDiv.className = 'card-description';
                descDiv.innerHTML = cardInfo.text;
                const originalDesc = document.querySelector(`#${itemDivID} .card-description`);
                if (originalDesc && originalDesc.offsetParent !== null) { // Ensure element is visible
                    const originalSize = window.getComputedStyle(originalDesc).fontSize;
                    descDiv.style.fontSize = `calc(${originalSize} * ${scale / 0.20})`;
                } else {
                    // Fallback calculation
                    const baseSize = 10 * (scale / 0.20); // 10px base * scale factor
                    descDiv.style.fontSize = `${baseSize}px`;
                }

                textContainer.appendChild(nameDiv);
                textContainer.appendChild(descDiv);
                cardDiv.appendChild(textContainer);
            }

            return cardDiv;
        },

        adjustTextSize: function(element, scale = 0.20) {
            const baseFontSize = 10 * (scale / 0.20); // Scale font relative to card size
            const maxHeight = element.offsetHeight;
            let fontSize = baseFontSize;
            
            element.style.fontSize = `${fontSize}px`;
            while (element.scrollHeight > maxHeight && fontSize > 7) {
                fontSize--;
                element.style.fontSize = `${fontSize}px`;
            }
        },

        updateCardDisplay: function(cards) {
            if (!Array.isArray(cards)) cards = [cards];

            cards.forEach(card => {
                if (this.gamedatas.assassins && this.gamedatas.assassins[card.card_id]) {
                    this.assassinRemove(card.card_id);
                }

                if (card.card_location == 'aside') {
                    return;
                }
                // Find current stock
                const fromStock = this.findCardStock(card.card_id);
                const targetPlayerId = card.card_owner;
                const toStock = card.card_location == 'court' ? 
                    this.playerStocks[targetPlayerId].court : 
                    this.playerStocks[targetPlayerId].hand;
                const typeId = this.cardTypeMap[card.card_type] || this.cardTypeMap['Backside'];

                if (!toStock && !fromStock) return;

                if (!toStock && fromStock) {
                    fromStock.removeFromStockById(
                        card.card_id, 
                    );
                }

                // Manage Assassin-Play
                if (card.card_location == 'court' && card.card_type == 'Assassin') {
                    if (fromStock && fromStock !== toStock) {
                        this.slideToObject( $(`${fromStock.container_div.id}_item_${card.card_id}`), `${toStock.container_div.id}_item_${card.ontop_of}`,  this.slideDuration).play();
                        setTimeout(() => {
                            this.assassinCreateElement(card.card_id, card.ontop_of, targetPlayerId);
                            this.assassinPosition(card.card_id, card.ontop_of);
                            fromStock.removeFromStockById(
                                card.card_id, 
                            );
                        }, this.slideDuration);
                    } else {
                        this.assassinCreateElement(card.card_id, card.ontop_of, targetPlayerId);
                        this.assassinPosition(card.card_id, card.ontop_of);
                    }
                    return;
                }

                //Regular Cards
                if (fromStock && fromStock !== toStock) {
                    toStock.addToStockWithId(
                        typeId,
                        card.card_id.toString()
                    );
                    dojo.addClass(`${toStock.container_div.id}_item_${card.card_id}`, 'delayed-appearance');

                    this.slideToObject( $(`${fromStock.container_div.id}_item_${card.card_id}`), `${toStock.container_div.id}_item_${card.card_id}`,  this.slideDuration).play();
                    
                    setTimeout(function() {
                        fromStock.removeFromStockById(
                            card.card_id, 
                        );
                        dojo.removeClass(`${toStock.container_div.id}_item_${card.card_id}`, 'delayed-appearance');
                    }, this.slideDuration);
                    return;

                } else {
                    toStock.addToStockWithId(
                        typeId,
                        card.card_id.toString(),
                    );
                }
    
            });
        },

        findCardStock: function(cardId) {
            const searchId = String(cardId);
            
            for (const playerId in this.playerStocks) {
                const { hand, court } = this.playerStocks[playerId];
                
                // Check hand items
                const inHand = hand.items.some(item => String(item.id) === searchId);
                if (inHand) {
                    return hand;
                }
                
                // Check court items
                const inCourt = court.items.some(item => String(item.id) === searchId);
                if (inCourt) {
                    return court;
                }
            }
            
            return null;
        },

        showPlayerTargets: function(cardId) {
            this.statusBar.removeActionButtons();
            if (this.isCurrentPlayerActive()) {
                this.statusBar.setTitle(_('${you} must choose a target court to play the card to'));
            }
            const cardType = this.getCardType(cardId);

            // Highlight clickable courts and add handlers
            this._courtHandlers = [];
            Object.values(this.gamedatas.players).forEach(player => {
                const courtZone = dojo.byId(`court-zone-${player.id}`);
                if (!courtZone) return;

                // Check if court is valid target
                const isValid = cardType === 'Assassin' ? 
                    this.playerStocks[player.id].court.items.length > 0 :
                    true;

                if (isValid) {
                    // Add visual class
                    dojo.addClass(courtZone, 'zone-clickable');
                    
                    // Add click handler
                    const clickHandler = dojo.connect(courtZone, 'click', () => {
                        this.cleanupCourtSelection();
                        this.confirmCardPlay(cardId, player.id);
                    });
                    
                    // Store reference for cleanup
                    this._courtHandlers.push({ courtZone, clickHandler });
                }
            });

            // Disable current player's hand except selected card
            const currentPlayerHand = this.playerStocks[this.player_id].hand;
            currentPlayerHand.setSelectionMode(0);
            currentPlayerHand.items.forEach(item => {
                const itemDiv = $(`${currentPlayerHand.container_div.id}_item_${item.id}`);
                if (item.id.toString() === this.selectedCardId) {
                    dojo.addClass(itemDiv, 'stockitem_unselectable_blocked');
                }
            });

            // Add cancel button
            this.statusBar.addActionButton(
                _("Cancel"),
                () => this.cleanupCourtSelection(),
                { color: 'secondary' }
            );
        },

        cleanupCourtSelection: function() {
            // Remove all court highlighting and handlers
            if (this._courtHandlers) {
                this._courtHandlers.forEach(({ courtZone, clickHandler }) => {
                    dojo.removeClass(courtZone, 'zone-clickable');
                    dojo.disconnect(clickHandler);
                });
                this._courtHandlers = [];
            }

            // Restore current player's hand
            const currentPlayerHand = this.playerStocks[this.player_id].hand;
            currentPlayerHand.items.forEach(item => {
                const itemDiv = $(`${currentPlayerHand.container_div.id}_item_${item.id}`);
                dojo.removeClass(itemDiv, 'stockitem_unselectable_blocked');
            });
            currentPlayerHand.setSelectionMode(this.isCurrentPlayerActive() ? 1 : 0);
            
            this.statusBar.removeActionButtons();
            this.clearSelection();
            this.updatePageTitle();
        },

        unselectAllCards: function() {
            for (const playerId in this.playerStocks) {
                const stocks = this.playerStocks[playerId];
                stocks.hand.unselectAll();
                stocks.court.unselectAll();
            }
        },

        assassinKill: function(killer, victim) {
            Object.entries(this.gamedatas.cards).forEach(([key, card]) => {
                if (card.card_id == killer || card.card_id == victim) {
                    this.gamedatas.cards[key].card_location = 'aside';
                    this.gamedatas.cards[key].card_owner = 'noPlayerID';
                    this.gamedatas.cards[key].ontop_of = 0;
                }
            }); 
            const fromStock = this.findCardStock(killer);
            this.slideToObject( $(`${fromStock.container_div.id}_item_${killer}`), `assassin_${victim}`,  this.slideDuration).play();
            setTimeout(function() {
                fromStock.removeFromStockById(
                    killer, 
                );
                dojo.destroy(`assassin_${victim}`);
            }, this.slideDuration);

            delete this.gamedatas.assassins[victim];
        },

        //manage Assassin Cards ontop of other cards:
        assassinCreateElement: function(cardId, coveredCardId, targetPlayerId) {
            // Prevent duplicate creation
            if (this.gamedatas.assassins && this.gamedatas.assassins[cardId]) {
                return this.gamedatas.assassins[cardId].div;
            }

            const assassinTypeId = this.cardTypeMap['Assassin'];
            const assassinIndex = assassinTypeId - 1; // Get 0-based index
            
            // Calculate background position percentages
            const imageItemsPerRow = 4;
            const col = assassinIndex % imageItemsPerRow;
            const row = Math.floor(assassinIndex / imageItemsPerRow);
            const xPercent = (col / (imageItemsPerRow - 1)) * 100;
            const yPercent = (row / 2) * 100; // 3 rows total (0-2)

            const div = document.createElement('div');
            div.id = `assassin_${cardId}`;
            div.className = 'assassin-overlay';
            
            // Set dimensions matching scaled cards
            div.style.width = `${this.scaledCardWidth}px`;
            div.style.height = `${this.scaledCardHeight}px`;
            
            // Configure spritesheet background
            div.style.backgroundImage = `url(${g_gamethemeurl}img/KotW_Cards_Spreadsheet.jpg)`;
            div.style.backgroundSize = `${this.scaledSpriteWidth}px ${this.scaledSpriteHeight}px`;
            div.style.backgroundPosition = `${xPercent}% ${yPercent}%`;
            
            // Add to game area
            document.getElementById('game_play_area').appendChild(div);

            // Initialize state tracking
            this.gamedatas.assassins = this.gamedatas.assassins || {};
            this.gamedatas.assassins[cardId] = {
                div: div,
                coveredCardId: coveredCardId,
                targetPlayerId: targetPlayerId
            };

            // Add name and text elements
            const cardInfo = this.cardInformation()['Assassin'];
            
            // Name element
            const nameDiv = document.createElement('div');
            nameDiv.className = 'card-text'; // Reuse standard card text styling
            nameDiv.innerHTML = cardInfo.name;
            div.appendChild(nameDiv);

            // Description element
            const descDiv = document.createElement('div');
            descDiv.className = 'card-description';
            descDiv.innerHTML = cardInfo.text;
            div.appendChild(descDiv);
            
            // Adjust text size for description
            this.adjustTextSize(descDiv);

            // // Add tooltip
            cardInformation = this.cardInformation();

            dojo.connect(div, 'click', () => {
                if (this.selectedAssassin != 0) {
                    const assassin = this.selectedAssassin;
                    this.cleanupAssassinSelection();
                    this.assassinFinalizePlay(coveredCardId, assassin);
                }
            });

            return div;
        },

    assassinPosition: function(assassinId, coveredCardId) {
        const assassin = this.gamedatas.assassins[assassinId];
        if (!assassin || !coveredCardId) return;

        // Find the covered card element
        const coveredStock = this.findCardStock(coveredCardId);
        if (!coveredStock) {
            // console.warn('Covered card not found yet, retrying...');
            setTimeout(() => this.assassinPosition(assassinId, coveredCardId), 100);
            return;
        }

        const coveredDiv = $(`${coveredStock.container_div.id}_item_${coveredCardId}`);
        if (!coveredDiv) return;

        // Use getBoundingClientRect for reliable positioning
        const coveredRect = coveredDiv.getBoundingClientRect();
        const assassinRect = assassin.div.getBoundingClientRect();
        
        // Calculate relative to game area
        const gameArea = document.getElementById('game_play_area');
        const gameRect = gameArea.getBoundingClientRect();
        
        // Convert to percentage-based positioning
        const leftPercent = ((coveredRect.left - gameRect.left) / gameRect.width * 100);
        const topPercent = ((coveredRect.top - gameRect.top) / gameRect.height * 100);

        Object.assign(assassin.div.style, {
            left: `${leftPercent}%`,
            top: `${topPercent}%`,
        });

        // Store reference to covered card
        assassin.coveredCardId = coveredCardId;
        assassin.targetPlayerId = coveredStock.ownerPlayerId;

        this.gamedatas.assassins[assassinId] = assassin;
    },
    assassinSyncPositions: function() {
        Object.entries(this.gamedatas.assassins || {}).forEach(([assassinId, assassin]) => {
            // Validate DOM element existence
            if (!document.contains(assassin.div)) {
                delete this.gamedatas.assassins[assassinId];
                return;
            }

            if (assassin.coveredCardId) {
                // Find current position of covered card
                const coveredStock = this.findCardStock(assassin.coveredCardId);
                if (coveredStock) {
                    const coveredDiv = $(`${coveredStock.container_div.id}_item_${assassin.coveredCardId}`);
                    if (coveredDiv) {
                        this.assassinPosition(assassinId, assassin.coveredCardId);
                    }
                }
            }
        });
    },

    assassinsCleanOrphaned: function() {
        const validIds = new Set(this.gamedatas.cards
            .filter(c => c.card_type === 'Assassin')
            .map(c => c.card_id.toString())
        );
        
        Object.keys(this.gamedatas.assassins).forEach(assassinId => {
            if (!validIds.has(assassinId)) {
                this.assassinRemove(assassinId);
            }
        });
    },

    assassinRemove: function(cardId) {
        const assassin = this.gamedatas.assassins[cardId];
        if (assassin) {
            // Immediate DOM removal
            if (assassin.div && document.body.contains(assassin.div)) {
                assassin.div.remove();
            }
            // Cleanup data
            delete this.gamedatas.assassins[cardId];
        }
    },

        ///////////////////////////////////////////////////
        //// Player's action
        
        /*
        
            Here, you are defining methods to handle player's action (ex: results of mouse click on 
            game objects).
            
            Most of the time, these methods:
            _ check the action is possible at this game state.
            _ make a call to the game server
        
        */
        
        // Example:
        
        onCardSelection: function(controlName, itemId) {
            if (this.selectedCardId === itemId) {
                this.clearSelection();
                return;
            }
            const stock = this.getStockFromControlName(controlName);
            const selectedItems = stock.getSelectedItems();
            
            if (selectedItems.length > 0) {
                const cardId = selectedItems[0].id;
                this.onCardClick(cardId);
            }
        },
        
        // Helper to get stock from control name:
        getStockFromControlName: function(controlName) {
            for (const playerId in this.playerStocks) {
                const stocks = this.playerStocks[playerId];
                if (stocks.hand.control_name === controlName) return stocks.hand;
                if (stocks.court.control_name === controlName) return stocks.court;
            }
            return null;
        },
        
        // Modified card click handler:
        onCardClick: function(cardId) {
            // Get the actual card element
            const cardElement = this.findCardElement(cardId);
            
            // Check if card is marked as unselectable
            if ((cardElement && dojo.hasClass(cardElement, 'stockitem_unselectable_singlecard')) ||
                (cardElement && dojo.hasClass(cardElement, 'stockitem_unselectable_blocked'))) {
                this.clearSelection();
                return;
            }

            if (this.selectedCardId === cardId) {
                this.clearSelection();
                return;
            }

            const cardType = this.getCardType(cardId);

            if (this.selectedAssassin != 0) {
                const assassin = this.selectedAssassin;
                this.cleanupAssassinSelection()
                this.assassinFinalizePlay(cardId, assassin);
                return;
            }

            if (cardType == 'Assassin' &&
                this.gamedatas.gamestate.name != 'selectionTraderPlayer' &&
                this.gamedatas.gamestate.name != 'selectionTraderOpponent' &&
                this.gamedatas.gamestate.name != 'selectionKnight') {
                // Store selection context
                this.selectedAssassin = cardId;
                
                // Show target selection
                this.assassinShowTargetCards(cardId);
                return;
            }

            this.statusBar.removeActionButtons()

            if (this.gamedatas.gamestate.name == 'selectionKnight') {
                this.knightPlayCard(cardId);
                return;
            }

            if (this.gamedatas.gamestate.name == 'selectionTraderPlayer') {
                this.traderPlayCardPlayer(cardId);
                return;
            }

            if (this.gamedatas.gamestate.name == 'selectionTraderOpponent') {
                this.traderPlayCardOpponent(cardId);
                return;
            }

            if (this.gamedatas.gamestate.name == 'selectionScholar') {
                this.scholarPlayCard(cardId);
                return;
            }

            if (this.gamedatas.gamestate.name == 'selectionPriestFirst') {
                this.priestPlayCardFirst(cardId);
                return;
            }

            if (this.gamedatas.gamestate.name == 'selectionPriestSecond') {
                this.priestPlayCardSecond(cardId);
                return;
            }

            this.selectedCardId = cardId;
            const cardStock = this.findCardStock(cardId);
            cardStock.selectItem(cardId);
            this.showPlayerTargets(cardId);
        },

        findCardElement: function(cardId) {
            // Search through all stocks
            for (const playerId in this.playerStocks) {
                const { hand, court } = this.playerStocks[playerId];
                
                // Check hand stock
                const handItem = hand.items.find(item => item.id == cardId);
                if (handItem) {
                    return $(`${hand.container_div.id}_item_${cardId}`);
                }
                
                // Check court stock
                const courtItem = court.items.find(item => item.id == cardId);
                if (courtItem) {
                    return $(`${court.container_div.id}_item_${cardId}`);
                }
            }
            return null;
        },

        confirmCardPlay: function(cardId, targetPlayerId) {
            const cardType = this.getCardType(cardId);
    
            this.bgaPerformAction("actPlayCard", {
                card_id: cardId,
                target_player_id: targetPlayerId,
                covered_card: 0
            }).then(() => {
                this.clearSelection();
            });

        },
        
        knightPlayCard: function(cardId) {
            this.bgaPerformAction("actSelectionKnight", {
                card_id: cardId,
            });
        },

        traderPlayCardPlayer: function(cardId) {
            this.bgaPerformAction("actSelectionTraderPlayer", {
                card_id: cardId,
            });
        },

        traderPlayCardOpponent: function(cardId) {
            this.bgaPerformAction("actSelectionTraderOpponent", {
                card_id: cardId,
            });
        },

        scholarPlayCard: function(cardId) {
            this.bgaPerformAction("actSelectionScholar", {
                card_id: cardId,
            });
        },

        priestPlayCardFirst: function(cardId) {
            this.bgaPerformAction("actSelectionPriestFirst", {
                card_id: cardId,
            });
        },

        priestPlayCardSecond: function(cardId) {
            this.bgaPerformAction("actSelectionPriestSecond", {
                card_id: cardId,
            });
        },

        priestPass: function () {
            this.bgaPerformAction("actPassPriest");
            this.statusBar.removeActionButtons();
        },

        assassinGetValidTargets: function(targetCourt) {
            const playerCards = targetCourt.getAllItems();
            const validCards = Object.values(playerCards);
            
            // Get all covered card IDs
            const coveredCards = new Set(
                Object.values(this.gamedatas.assassins || {}).map(a => a.coveredCardId)
            );

            // Find uncovered Guards
            const guards = validCards.filter(card => 
                this.getCardType(card.id) === 'Guard' && 
                !coveredCards.has(card.id.toString()) // Convert to string for consistent comparison
            );

            return guards.length > 0 ? guards : validCards;
        },

        assassinShowTargetCards: function(targetCards) {
            this.statusBar.removeActionButtons()
            if (this.isCurrentPlayerActive()) {
                this.statusBar.setTitle(_('${you} must choose a target for the assassin'));
            }

            // Disable current player's hand except selected assassin
            const currentPlayerHand = this.playerStocks[this.player_id].hand;
            currentPlayerHand.setSelectionMode(0);
            currentPlayerHand.items.forEach(item => {
                const itemDiv = $(`${currentPlayerHand.container_div.id}_item_${item.id}`);
                if (item.id.toString() === this.selectedAssassin) {
                    dojo.addClass(itemDiv, 'stockitem_unselectable_blocked');
                }
            });

            // Get all covered card IDs
            const coveredCards = new Set(
                Object.values(this.gamedatas.assassins || {}).map(a => a.coveredCardId.toString())
            );

            // Enable selection in all courts
            Object.values(this.playerStocks).forEach(({ hand, court }) => {
                court.setSelectionMode(1);

                const validTargets = this.assassinGetValidTargets(court);

                // Filter out covered cards
                const uncoveredValidCards = validTargets.filter(card => 
                    !coveredCards.has(card.id.toString()) // Exclude if ID is covered
                );
            
                // Mark valid targets
                const validTargetIds = new Set(uncoveredValidCards.map(c => c.id.toString()));
                court.items.forEach(item => {
                    const itemDiv = $(`${court.container_div.id}_item_${item.id}`);
                    dojo.toggleClass(itemDiv, 'stockitem_unselectable_singlecard', !validTargetIds.has(item.id.toString()));
                });

                // Make assassins clickable
                Object.values(this.gamedatas.assassins).forEach(assassin => {
                    if (validTargets.some(card => card.id === assassin.coveredCardId)) {
                        dojo.addClass(assassin.div, 'stockitem');
                    }
                });
            });
    
            // Add cancel button
            this.statusBar.addActionButton(
                _("Cancel"),
                () => this.cleanupAssassinSelection(),
                { color: 'secondary' }
            );
        },

        cleanupAssassinSelection: function() {
            // Restore current player's hand
            const currentPlayerHand = this.playerStocks[this.player_id].hand;
            currentPlayerHand.items.forEach(item => {
                const itemDiv = $(`${currentPlayerHand.container_div.id}_item_${item.id}`);
                dojo.removeClass(itemDiv, 'stockitem_unselectable_blocked');
            });
            currentPlayerHand.setSelectionMode(this.isCurrentPlayerActive() ? 1 : 0);
        
            // Reset all courts
            Object.values(this.playerStocks).forEach(({ court }) => {
                court.setSelectionMode(0);
                court.items.forEach(item => {
                    const itemDiv = $(`${court.container_div.id}_item_${item.id}`);
                    dojo.removeClass(itemDiv, 'stockitem_unselectable_singlecard');
                });
            });
        
            // Reset assassins clickable
            Object.values(this.gamedatas.assassins).forEach(assassin => {
                dojo.removeClass(assassin.div, 'stockitem');
            });

            this.statusBar.removeActionButtons();
            this.clearSelection();
            this.updatePageTitle();
            this.selectedAssassin = 0;
        },

        // Final action handler
        assassinFinalizePlay: function(coveredCardId, assassinId) {
            const card = this.gamedatas.cards.find(c => c.card_id === coveredCardId);
            const cardOwner = card ? card.card_owner : null;

            this.bgaPerformAction("actPlayCard", {
                card_id: assassinId,
                target_player_id: cardOwner,
                covered_card: coveredCardId
            }).then(() => {
                this.clearSelection();
                this.selectedAssassin = 0;
            });
        },

        // Helper to get card type
        getCardType: function(cardId) {
            const card = this.gamedatas.cards.find(c => c.card_id == cardId);
            return card?.card_type || 'Backside';
        },

        cancelCardSelection: function() {
            // Refresh action buttons to default state
            this.clearSelection();
            this.statusBar.removeActionButtons()
            this.onUpdateActionButtons('playerTurn', this.gamedatas.actionArgs);
        },
        
        clearSelection: function() {
            this.selectedCardId = null;
            this.unselectAllCards();
            this.statusBar.removeActionButtons()
        },

        showRoundPopup: function(currentRound) {
            // Remove existing popup if present
            const existingPopup = document.getElementById('roundPopup');
            if (existingPopup) existingPopup.remove();

            // Create popup content
            const popupDiv = document.createElement('div');
            popupDiv.id = 'roundPopup';
            popupDiv.className = 'round-popup';

            // Get status message based on game mode
            let statusMessage = '';
            switch (this.gamedatas.roundsMode) {
                case 2:
                    statusMessage = _("No player has reached 42 points yet.");
                    break;
                case 3:
                    statusMessage = _("No player has won 2 rounds yet.");
                    break;
                case 4:
                    statusMessage = _("No player has won 3 rounds yet.");
                    break;
            }

            // Create popup HTML
            popupDiv.innerHTML = `
                <h2>${_("Round")} ${currentRound} ${_("finished")}</h2>
                ${statusMessage ? `<p>${statusMessage}</p>` : ''}
                <button id="startNextRoundBtn" class="round-popup-button">
                    ${_("Start Round")} ${currentRound + 1}
                </button>
            `;

            // Add popup to game area
            document.getElementById('game_play_area').appendChild(popupDiv);

            // Add click handler for the button
            document.getElementById('startNextRoundBtn').addEventListener('click', () => {
                popupDiv.style.animation = 'fadeOut 0.5s ease-out';
                setTimeout(() => popupDiv.remove(), 500);

                this.bgaPerformAction("actRemovePopup", {}, { checkAction: false, checkPossibleActions: false });
            });
        },

        // Update stock selection mode dynamically:
        onEnteringState: function(stateName, args) {
            switch(stateName) {
                case 'playerTurn':
                    //THIS IS -> Regular Card Selection
                    playedSquireIds = this.gamedatas.cards
                    .filter(item => item.card_type === 'Squire' && item.card_location === 'court')
                    .map(squire => squire.card_id.toString());
                    allCourtCards = this.gamedatas.cards
                    .filter(item => item.card_location === 'court')
                    .map(item => item.card_id.toString());

                    // Enable selection only in current player's hand
                    Object.values(this.playerStocks).forEach(({ hand, court }) => {
                        const isCurrentPlayer = hand.ownerPlayerId === this.player_id;
                        const isActive = this.isCurrentPlayerActive();
                        hand.setSelectionMode(isCurrentPlayer && isActive ? 1 : 0);
                        court.setSelectionMode(0); // Never select from courts

                        if (isCurrentPlayer && isActive) {
                            //Check mandatory Squire Play
                            const squireIds = hand.items
                            .filter(item => this.getCardType(item.id) === 'Squire')
                            .map(squire => squire.id.toString());

                            //check covered cards in court
                            coveredCards = [];
                            Object.values(this.gamedatas.assassins).forEach(assassin => {
                                coveredCards.push(assassin.coveredCardId);
                            });
                            const courtIds = court.items
                            .filter(item => !coveredCards.includes(item.id.toString()))
                            .map(item => item.id.toString());

                            hand.items.forEach(item => {
                                const itemDiv = $(`${hand.container_div.id}_item_${item.id}`);
                                if ((playedSquireIds.length > 0 && squireIds.length > 0) && (!squireIds.includes(item.id.toString())) ||
                                    (courtIds.length < 3 && this.getCardType(item.id) === 'Princess' && hand.items.length > 1) ||
                                    (allCourtCards.length === 0 && this.getCardType(item.id) === 'Assassin')
                                    ) {
                                    dojo.addClass(itemDiv, 'stockitem_unselectable_singlecard');
                                }
                            });
                        }
                    });
                    break;
                case 'selectionKnight':
                    //THIS IS -> Take Card from Targer Player Hand (Squire if possible)
                    Object.values(this.playerStocks).forEach(({ hand, court }) => {
                        const isTargetPlayer = this.gamedatas.targetPlayer == hand.ownerPlayerId;
                        const isActive = this.isCurrentPlayerActive();
                
                        if (isTargetPlayer && isActive) {
                            // Get all Squire IDs
                            const squireIds = hand.items
                                .filter(item => this.getCardType(item.id) === 'Squire')
                                .map(squire => squire.id.toString());

                            // Enable selection mode but filter in click handler
                            hand.setSelectionMode(1);
                            hand.horizontal_overlap  = 100;
                            hand.updateDisplay();
                            
                            if (squireIds.length > 0) {
                                // Add CSS classes to non-Squires
                                hand.items.forEach(item => {
                                    const itemDiv = $(`${hand.container_div.id}_item_${item.id}`);
                                    if (!squireIds.includes(item.id.toString())) {
                                        dojo.addClass(itemDiv, 'stockitem_unselectable_singlecard');
                                    }
                                });
                            }

                        } else {
                            hand.setSelectionMode(0);
                        }
                        court.setSelectionMode(0);
                    });
                    break;
                case 'selectionTraderPlayer':
                    //THIS IS -> Give Target Player on Card from your Hand
                    Object.values(this.playerStocks).forEach(({ hand, court }) => {
                        const isCurrentPlayer = hand.ownerPlayerId === this.player_id;
                        const isActive = this.isCurrentPlayerActive();
                        hand.setSelectionMode(isCurrentPlayer && isActive ? 1 : 0);
                        court.setSelectionMode(0); // Never select from courts
                    });
                    break;
                case 'selectionTraderOpponent':
                    //THIS IS -> Target Player has to give card with higher influence back (or highest)
                    // Update status bar
                    const isActiveStart = this.isCurrentPlayerActive();
                    if (isActiveStart) {
                        const allPlayers = this.gamedatas.players;
                        const targetPlayerID = this.gamedatas.targetPlayer;
                        const targetPlayer = allPlayers[targetPlayerID]; // Use bracket notation
                        let args = [];
                        args.targetPlayerName = targetPlayer ? targetPlayer.name : "Unknown Player";
                        const statusText = _('Trader: ${you} must give ${targetPlayerName} back a card with higher influence (or the highest)');
                        this.statusBar.setTitle(statusText, args);
                    }

                    Object.values(this.playerStocks).forEach(({ hand, court }) => {
                        const isCurrentPlayer = hand.ownerPlayerId === this.player_id;
                        const isActive = this.isCurrentPlayerActive();
                        hand.setSelectionMode(isCurrentPlayer && isActive ? 1 : 0);
                        court.setSelectionMode(0); // Never select from courts

                        if (isCurrentPlayer && isActive) {
                            //Check Influence of Cards in Hand
                            const targetInfluence = this.gamedatas.targetInfluence;
                            const cardInformation = this.cardInformation();
                            const blockedCard = this.gamedatas.blockedCard;

                            highestInfluence = 0;
                            higherInfluenceCards = [];
                            hand.items.forEach(item => {
                                const itemType = this.getCardType(item.id);
                                if (cardInformation[itemType].influence > highestInfluence && item.id != blockedCard) {
                                    highestInfluence = cardInformation[itemType].influence;
                                }
                                if (cardInformation[itemType].influence > targetInfluence && item.id != blockedCard) {
                                    higherInfluenceCards.push(item.id.toString());
                                }
                            });

                            // Add CSS classes to unplayable cards
                            hand.items.forEach(item => {
                                const itemDiv = $(`${hand.container_div.id}_item_${item.id}`);
                                const itemType = this.getCardType(item.id);
                                if ((higherInfluenceCards.length > 0 && !higherInfluenceCards.includes(item.id.toString()) && item.id != blockedCard) || 
                                    (higherInfluenceCards.length === 0 && cardInformation[itemType].influence != highestInfluence && item.id != blockedCard)) {
                                    dojo.addClass(itemDiv, 'stockitem_unselectable_singlecard');
                                }
                                if (item.id == blockedCard) {
                                    dojo.addClass(itemDiv, 'stockitem_unselectable_blocked');
                                }
                            });

                        }
                    });
                    break;
                case 'selectionScholar':
                    //THIS IS -> Take on Card from Target Court (4 or lower, if not possible any. Not Scholar or Assassin)
                    Object.values(this.playerStocks).forEach(({ hand, court }) => {
                        const isTargetPlayer = this.gamedatas.targetPlayer == hand.ownerPlayerId;
                        const isActive = this.isCurrentPlayerActive();
                        const blockedCard = this.gamedatas.blockedCard;
                        hand.setSelectionMode(0);
                        court.setSelectionMode(isTargetPlayer && isActive ? 1 : 0); // Never select from courts
    
                        if (isTargetPlayer && isActive) {
                            //Check Influence of Cards in Hand
                            const cardInformation = this.cardInformation();
                            coveredCards = [];
                            Object.values(this.gamedatas.assassins).forEach(assassin => {
                                coveredCards.push(assassin.coveredCardId);
                            });
                            validCardsUnderFive = [];
                            validCardsAll = [];

                            court.items.forEach(item => {
                                const itemType = this.getCardType(item.id);
                                if (cardInformation[itemType].influence < 5 && itemType != 'Assassin' && itemType != 'Scholar' && !coveredCards.includes(item.id.toString())) {
                                    validCardsUnderFive.push(item.id.toString());
                                }
                                if (itemType != 'Assassin' && itemType != 'Scholar' && !coveredCards.includes(item.id.toString())) {
                                    validCardsAll.push(item.id.toString());
                                }
                            });

                            if (validCardsUnderFive.length > 0) {
                                // Add CSS classes to non-Squires
                                court.items.forEach(item => {
                                    const itemDiv = $(`${court.container_div.id}_item_${item.id}`);
                                    if (!validCardsUnderFive.includes(item.id.toString()) && item.id != blockedCard) {
                                        dojo.addClass(itemDiv, 'stockitem_unselectable_singlecard');
                                    }
                                    if (item.id == blockedCard) {
                                        dojo.addClass(itemDiv, 'stockitem_unselectable_blocked');
                                    }
                                });
                            } else {
                                court.items.forEach(item => {
                                    const itemDiv = $(`${court.container_div.id}_item_${item.id}`);
                                    if (!validCardsAll.includes(item.id.toString()) && item.id != blockedCard) {
                                        dojo.addClass(itemDiv, 'stockitem_unselectable_singlecard');
                                    }
                                    if (item.id == blockedCard) {
                                        dojo.addClass(itemDiv, 'stockitem_unselectable_blocked');
                                    }
                                });
                            }
                        }
                    });
                    break;       
                case 'selectionPriestFirst':
                    //THIS IS -> Nearly regular card selection. But Target player need to have card with lower value. Not Assassin or Jester
                    playedSquireIds = this.gamedatas.cards
                    .filter(item => item.card_type === 'Squire' && item.card_location === 'court')
                    .map(squire => squire.card_id.toString());
                    allCourtCards = this.gamedatas.cards
                    .filter(item => item.card_location === 'court')
                    .map(item => item.card_id.toString());
    
                    //check covered cards in court
                    coveredCards = [];
                    Object.values(this.gamedatas.assassins).forEach(assassin => {
                        coveredCards.push(assassin.coveredCardId);
                    });

                    const cardInformation = this.cardInformation();
                    lowestInfluence = 10;
                    this.gamedatas.cards.forEach(item => {
                        if (item.card_location == 'court' && item.card_owner == this.gamedatas.targetPlayer) {
                            const cardInfluence = cardInformation[item.card_type].influence;
                            if (cardInfluence < lowestInfluence && item.card_type != 'Assassin' && item.card_type != 'Jester' && item.card_id != this.gamedatas.blockedCard && !coveredCards.includes(item.card_id)) {
                                lowestInfluence = cardInfluence;
                            }
                        }
                    });

                    // Enable selection only in current player's hand
                    Object.values(this.playerStocks).forEach(({ hand, court }) => {
                        const isCurrentPlayer = hand.ownerPlayerId === this.player_id;
                        const isActive = this.isCurrentPlayerActive();
                        hand.setSelectionMode(isCurrentPlayer && isActive ? 1 : 0);
                        court.setSelectionMode(0); // Never select from courts
    
                        //Check mandatory Squire Play
                        const squireIds = hand.items
                        .filter(item => this.getCardType(item.id) === 'Squire')
                        .map(squire => squire.id.toString());

                        const courtIds = court.items
                        .filter(item => !coveredCards.includes(item.id.toString()))
                        .map(item => item.id.toString());

                        if (isCurrentPlayer && isActive) {
                            hand.items.forEach(item => {
                                const itemType = this.getCardType(item.id);
                                const itemInfluence = cardInformation[itemType].influence;
                                const itemDiv = $(`${hand.container_div.id}_item_${item.id}`);
                                if (
                                    (playedSquireIds.length > 0 && squireIds.length > 0 && !squireIds.includes(item.id.toString())) ||
                                    (courtIds.length < 3 && this.getCardType(item.id) === 'Princess' && hand.items.length > 1) ||
                                    (allCourtCards.length === 0 && this.getCardType(item.id) === 'Assassin') ||
                                    (itemInfluence <= lowestInfluence)
                                    ) {
                                    dojo.addClass(itemDiv, 'stockitem_unselectable_singlecard');
                                }
                            });
                        }
                    });

                    const isActive = this.isCurrentPlayerActive();
                    if (isActive === true) {
                        this.statusBar.addActionButton(
                            _("Pass"),
                            () => this.priestPass(),
                            { color: 'secondary' }
                        );
                    }

                    break;
                case 'selectionPriestSecond':
                    //THIS IS -> But Target player needs to give back card with lower value. Not Assassin or Jester
                    Object.values(this.playerStocks).forEach(({ hand, court }) => {
                        const isTargetPlayer = this.gamedatas.targetPlayer == hand.ownerPlayerId;
                        const isActive = this.isCurrentPlayerActive();
                        hand.setSelectionMode(0);
                        court.setSelectionMode(isTargetPlayer && isActive ? 1 : 0); // Never select from courts
            
                        if (isTargetPlayer && isActive) {
                            //Check Influence of Cards in Hand
                            const cardInformation = this.cardInformation();
                            const targetInfluence = this.gamedatas.targetInfluence;
                            const blockedCard = this.gamedatas.blockedCard;
                            coveredCards = [];
                            Object.values(this.gamedatas.assassins).forEach(assassin => {
                                coveredCards.push(assassin.coveredCardId);
                            });
                            validCardsAll = [];
        
                            court.items.forEach(item => {
                                const itemType = this.getCardType(item.id);
                                if (!coveredCards.includes(item.id.toString()) && targetInfluence > cardInformation[itemType].influence && itemType != 'Assassin' && itemType != 'Jester' && item.id != blockedCard) {
                                    validCardsAll.push(item.id.toString());
                                }
                            });
                            court.items.forEach(item => {
                                const itemDiv = $(`${court.container_div.id}_item_${item.id}`);
                                if (!validCardsAll.includes(item.id.toString()) && item.id != blockedCard) {
                                    dojo.addClass(itemDiv, 'stockitem_unselectable_singlecard');
                                }
                                if (item.id == blockedCard) {
                                    dojo.addClass(itemDiv, 'stockitem_unselectable_blocked');
                                }
                            });
                        }
                    });
                    break;  
            }
        },

        onLeavingState: function(stateName) {
            if (stateName === 'selectionKnight' || stateName === 'playerTurn' || stateName === 'selectionTraderOpponent' || stateName === 'selectionPriestFirst') {
                Object.values(this.playerStocks).forEach(({ hand }) => {
                    hand.items.forEach(item => {
                        const itemDiv = $(`${hand.container_div.id}_item_${item.id}`);
                        dojo.removeClass(itemDiv, 'stockitem_unselectable_singlecard');
                        dojo.removeClass(itemDiv, 'stockitem_unselectable_blocked');
                    });

                    const isCurrentPlayer = hand.ownerPlayerId === this.player_id;
                    if (stateName === 'selectionKnight' && !isCurrentPlayer) {
                        hand.horizontal_overlap  = 22;
                        hand.updateDisplay();
                    }

                    this.updatePageTitle()
                });
            }
            if (stateName === 'selectionScholar' || stateName === 'selectionPriestSecond') {
                Object.values(this.playerStocks).forEach(({ court }) => {
                    court.items.forEach(item => {
                        const itemDiv = $(`${court.container_div.id}_item_${item.id}`);
                        dojo.removeClass(itemDiv, 'stockitem_unselectable_singlecard');
                        dojo.removeClass(itemDiv, 'stockitem_unselectable_blocked');
                    });
                });
            }
        },

        ///////////////////////////////////////////////////
        //// Reaction to cometD notifications

        /*
            setupNotifications:
            
            In this method, you associate each of your game notifications with your local method to handle it.
            
            Note: game notification names correspond to "notifyAllPlayers" and "notifyPlayer" calls in
                  your thekingofthewoods.game.php file.
        
        */
        setupNotifications: function()
        {
            console.log( 'notifications subscriptions setup' );
            
            // Example 1: standard notification handling
            // dojo.subscribe( 'cardPlayed', this, "notif_cardPlayed" );
            
            // Example 2: standard notification handling + tell the user interface to wait
            //            during 3 seconds after calling the method in order to let the players
            //            see what is happening in the game.
            // dojo.subscribe( 'cardPlayed', this, "notif_cardPlayed" );
            // this.notifqueue.setSynchronous( 'cardPlayed', 3000 );
            // 

            dojo.subscribe('cardMoved', this, notif => {
                if (notif.args.spectator && !this.isSpectator) {
                    return;
                }

                this.assassinsCleanOrphaned();

                // Ensure we always get an array
                const cards = Array.isArray(notif.args.cards) ? 
                    notif.args.cards : 
                    [notif.args.cards];
                
                    allCards = this.gamedatas.cards;
                    notif.args.cards.forEach(updatedCard => {
                        const index = allCards.findIndex(c => c.card_id === updatedCard.card_id);
                        if (index !== -1) {
                            allCards[index] = updatedCard;
                        }
                    });

                this.gamedatas.cards = allCards;
                this.updateCardDisplay(cards);
                this.updatePlayerPanels();
            });
            this.notifqueue.setSynchronous('cardMoved', 700);

            dojo.subscribe('assassinKill', this, notif => {
                const killer = notif.args.killer.toString();
                const victim = notif.args.victim.toString();
                this.assassinKill(killer, victim);
            });
            this.notifqueue.setSynchronous('assassinKill', 500);

            dojo.subscribe('targetPlayer', this, notif => {
                this.gamedatas.targetPlayer = notif.args[0];
            });
            this.notifqueue.setSynchronous('targetPlayer', 100);

            dojo.subscribe('specialActivePlayer', this, notif => {
                this.gamedatas.specialActivePlayer = notif.args[0];
            });
            this.notifqueue.setSynchronous('specialActivePlayer', 100);

            dojo.subscribe('targetInfluence', this, notif => {
                this.gamedatas.targetInfluence = notif.args[0];
            });
            this.notifqueue.setSynchronous('targetInfluence', 100);

            dojo.subscribe('blockedCard', this, notif => {
                this.gamedatas.blockedCard = notif.args[0];
            });
            this.notifqueue.setSynchronous('blockedCard', 100);

            dojo.subscribe('playerscores', this, notif => {
                //Update Global Scores
                this.gamedatas.currentRound = notif.args.currentRound + 1;
                Object.values(notif.args.scores).forEach(player => {
                    this.gamedatas.players[player.id].rounds_before_points = player.rounds_before_points;
                    this.gamedatas.players[player.id].rounds_won = player.rounds_won;
                });
                this.updatePlayerPanels();
            });
            this.notifqueue.setSynchronous('playerscores', 100);

            dojo.subscribe('newRound', this, notif => {
                // Reset Player Stocks
                Object.values(this.playerStocks).forEach(({ hand, court }) => {
                    hand.removeAll();
                    court.removeAll();
                });

                //remove Assassins
                Object.keys(this.gamedatas.assassins).forEach(key => {
                    dojo.destroy(`assassin_${key}`);
                });
                this.gamedatas.assassins = {};

                this.showRoundPopup(notif.args.currentRound);
            });
            this.notifqueue.setSynchronous('newRound', 3000);

            dojo.subscribe('score', this, "notif_score");
            
        },  
        
        /*
        Example:
        
        notif_cardPlayed: function( notif )
        {
            console.log( 'notif_cardPlayed' );
            console.log( notif );
            
            // Note: notif.args contains the arguments specified during you "notifyAllPlayers" / "notifyPlayer" PHP call
        },    
        
        */

        notif_score: function(notif) {
            this.scoreCtrl[notif.args.player_id].setValue(notif.args.player_score);
        },
   });             
});
