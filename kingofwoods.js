/**
 *------
 * BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
 * KingOfWoods implementation : © <Your name here> <Your email address here>
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 *
 * kingofwoods.js
 *
 * KingOfWoods user interface script
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
    return declare("bgagame.kingofwoods", ebg.core.gamegui, {
        constructor: function(){
            console.log('kingofwoods constructor');
              
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
            this.actionContext = {
                cardId: null,
                targetPlayerId: null,
                targetCourt: null
            };

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
            
            // TODO: Set up your game interface here, according to "gamedatas"
            
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
            this.initializePlayerPanels();

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


        initializePlayerPanels: function () {
            Object.values(this.gamedatas.players).forEach(player => {
                const infoDiv = this.getPlayerPanelElement(player.id);
                if (!infoDiv) return;
        
                switch(this.gamedatas.roundsMode) {
                    case 2:
                        infoDiv.innerHTML = _("Points from prior rounds: ${points}/42").replace('${points}', player.rounds_before_points);
                        break;
                    case 3:
                        infoDiv.innerHTML = _("Rounds won: ${won}/2").replace('${won}', player.rounds_won);
                        break;
                    case 4:
                        infoDiv.innerHTML = _("Rounds won: ${won}/3").replace('${won}', player.rounds_won);
                        break;
                    default:
                        infoDiv.innerHTML = '';
                }
            });
        },

        initializePlayerStocks: function(players) {
            const playerTables = document.getElementById('player-tables');
            playerTables.innerHTML = '';
        
            // Get the official player order from BGA framework
            const playerOrder = this.gamedatas.playerorder;
        
            // Sort players according to official panel order
            const orderedPlayers = playerOrder.map(playerId => 
                Object.values(players).find(p => p.id == playerId)
            );

            Object.values(orderedPlayers).forEach(player => {
                // Create player area
                const playerDiv = document.createElement('div');
                playerDiv.className = 'player-area';
                playerDiv.innerHTML = `
                    <div class="player-header" style="color: #${player.color};">
                        <strong>${player.name}</strong>
                    </div>
                    <div class="player-zones">
                        <div class="zone hand-zone">
                            <div class="zone-label">Hand</div>
                            <div class="hand-container" id="hand-${player.id}"></div>
                        </div>
                        <div class="zone court-zone">
                            <div class="zone-label">Court</div>
                            <div class="court-container" id="court-${player.id}"></div>
                        </div>
                    </div>
                `;
                playerTables.appendChild(playerDiv);

                // Initialize Hand Stock
                const handStock = new ebg.stock();
                handStock.create(this, $(`hand-${player.id}`), 768, 1181);
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
                    // const tooltipCard = this.createCardElement(cardType, 0.4, itemDiv.id);
                    // const tooltipHTML = `
                    //         ${tooltipCard.outerHTML}
                    // `;
                    const tooltipHTML = `
                        <div class="card-tooltip">
                            <div class="tooltip-header">
                                <strong>${cardInformation[cardType].name}</strong>
                            </div>
                            <div class="tooltip-text">Influence: ${cardInformation[cardType].influence}</div>
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
                console.log('DIV ID', itemDivID);
                const originalDesc = document.querySelector(`#${itemDivID} .card-description`);
                console.log('originalDesc', document.querySelector(`#${itemDivID}`));
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
                            this.assassinCreateElement(card.card_id);
                            this.assassinPosition(card.card_id, card.ontop_of);
                            fromStock.removeFromStockById(
                                card.card_id, 
                            );
                        }, this.slideDuration);
                    } else {
                        this.assassinCreateElement(card.card_id);
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
            this.statusBar.removeActionButtons()
            
            // Get all players (including self)
            const players = this.gamedatas.players;

            // Get the official player order from BGA framework
            const playerOrder = this.gamedatas.playerorder;
        
            // Sort players according to official panel order
            const orderedPlayers = playerOrder.map(playerId => 
                Object.values(players).find(p => p.id == playerId)
            );
            
            // Add buttons for each player
            Object.values(orderedPlayers).forEach(player => {
                this.statusBar.addActionButton(
                    _('Play to ${player_name}\'s court').replace('${player_name}', player.name),
                    () => this.confirmCardPlay(cardId, player.id),
                    { color: player.color }
                );
            });
            
            // Add cancel button
            this.statusBar.addActionButton(
                _('Cancel'),
                () => this.cancelCardSelection(),
                { color: 'secondary' }
            );
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
        assassinCreateElement: function(cardId) {
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
                coveredCardId: null,
                targetPlayerId: null
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
            // const tooltipCard = this.createCardElement('Assassin', 0.4, div.id);
            // const tooltipHTML = `
            //         ${tooltipCard.outerHTML}
            // `;
            // const tooltipHTML = `
            //     <div class="card-tooltip">
            //         <div class="tooltip-header">
            //             <strong>${cardInformation['Assassin'].name}</strong>
            //         </div>
            //         <div class="tooltip-text">Influence: ${cardInformation['Assassin'].influence}</div>
            //         <div class="tooltip-text">${cardInformation['Assassin'].text}</div>
            //     </div>
            // `;
            // this.addTooltipHtml(div.id, tooltipHTML);

            return div;
        },

    assassinPosition: function(assassinId, coveredCardId) {
        const assassin = this.gamedatas.assassins[assassinId];
        if (!assassin || !coveredCardId) return;

        // Find the covered card element
        const coveredStock = this.findCardStock(coveredCardId);
        if (!coveredStock) {
            console.warn('Covered card not found yet, retrying...');
            setTimeout(() => this.assassinPosition(assassinId, coveredCardId), 100);
            return;
        }

        const coveredDiv = $(`${coveredStock.container_div.id}_item_${coveredCardId}`);
        if (!coveredDiv) return;

        // Get position relative to game area
        const gameArea = document.getElementById('game_play_area');
        const gameAreaRect = gameArea.getBoundingClientRect();
        const coveredRect = coveredDiv.getBoundingClientRect();

        // Calculate relative position
        const posX = coveredRect.left - gameAreaRect.left;
        const posY = coveredRect.top - gameAreaRect.top;

        // Position assassin with offset
        dojo.style(assassin.div, {
            left: `${posX + 0}px`,
            top: `${posY + 0}px`,
            position: 'absolute'
        });

        // Store reference to covered card
        assassin.coveredCardId = coveredCardId;
        assassin.targetPlayerId = coveredStock.ownerPlayerId;

        this.gamedatas.assassins[assassinId] = assassin;
    },
    assassinSyncPositions: function() {
        Object.entries(this.gamedatas.assassins || {}).forEach(([assassinId, assassin]) => {
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
            if (this.selectedCardId === cardId) {
                this.clearSelection();
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

        confirmCardPlay: function(cardId, targetPlayerId) {
            const cardType = this.getCardType(cardId);
    
            if (cardType === 'Assassin') {
                // Get target court cards
                const targetCourt = this.playerStocks[targetPlayerId].court;
                const validTargets = this.assassinGetValidTargets(targetCourt);
                
                if (validTargets.length === 0) {
                    this.showMessage(_("No valid targets in this court"), "error");
                    return;
                }
                
                // Store selection context
                this.actionContext = {
                    cardId: cardId,
                    targetPlayerId: targetPlayerId,
                    targetCourt: targetCourt
                };
                
                // Show target selection
                this.assassinShowTargetCards(validTargets);
            } else {
                //normal card play
                this.bgaPerformAction("actPlayCard", {
                    card_id: cardId,
                    target_player_id: targetPlayerId,
                    covered_card: 0
                }).then(() => {
                    this.clearSelection();
                });
            }
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
            coveredCards = [];
            Object.values(this.gamedatas.assassins).forEach(assassin => {
                coveredCards.push(assassin.coveredCardId);
            });
            cardInformation = this.cardInformation();
            // Add target buttons
            targetCards.forEach(targetCard => {
                const killAssassin = _('Kill Assassin');
                const cardType = this.getCardType(targetCard.id);
                covered = false;
                if (coveredCards.includes(targetCard.id)) {
                    this.statusBar.addActionButton(
                        cardInformation[cardType].name + ' (' + killAssassin + ')',
                        () => this.assassinFinalizePlay(targetCard.id),
                        { 
                            color: '#ff0000',
                            extraClasses: 'target-card-btn'
                        }
                    );
                } else {
                    this.statusBar.addActionButton(
                        cardInformation[cardType].name,
                        () => this.assassinFinalizePlay(targetCard.id),
                        { 
                            color: '#ff0000',
                            extraClasses: 'target-card-btn'
                        }
                    );
                }

            });
            
            // Add cancel button
            this.statusBar.addActionButton(
                _("Cancel"),
                () => this.cancelCardSelection(),
                { color: 'secondary' }
            );
        },

        // Final action handler
        assassinFinalizePlay: function(coveredCardId) {
            const ctx = this.actionContext;
            this.bgaPerformAction("actPlayCard", {
                card_id: ctx.cardId,
                target_player_id: ctx.targetPlayerId,
                covered_card: coveredCardId
            }).then(() => {
                this.clearSelection();
                delete this.actionContext;
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
            // Remove existing popup
            const existingPopup = $('roundPopup');
            if (existingPopup) existingPopup.parentNode.removeChild(existingPopup);
        
            // Create popup content
            const popupDiv = document.createElement('div');
            popupDiv.id = 'roundPopup';
            popupDiv.className = 'round-popup';
            
            // Get status message based on game mode
            let statusMessage = '';
            switch(this.gamedatas.roundsMode) {
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
        
            popupDiv.innerHTML = `
                <h2>${_("Round")} ${currentRound} ${_("finished")}</h2>
                ${statusMessage ? `<p>${statusMessage}</p>` : ''}
                <p>${_("Starting next round...")}</p>
            `;
        
            // Add to game area
            document.getElementById('game_play_area').appendChild(popupDiv);
        
            // Auto-remove after 2 seconds
            setTimeout(() => {
                popupDiv.style.animation = 'fadeOut 0.5s ease-out';
                setTimeout(() => {
                    popupDiv.parentNode.removeChild(popupDiv);
                }, 500);
            }, 2000);
        },

        // Update stock selection mode dynamically:
        onEnteringState: function(stateName, args) {
            switch(stateName) {
                case 'playerTurn':
                    playedSquireIds = this.gamedatas.cards
                    .filter(item => item.card_type === 'Squire' && item.card_location === 'court')
                    .map(squire => squire.card_id.toString());

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
                        if (playedSquireIds.length > 0 && squireIds.length > 0) {
                            // Add CSS classes to non-Squires
                            hand.items.forEach(item => {
                                const itemDiv = $(`${hand.container_div.id}_item_${item.id}`);
                                if (!squireIds.includes(item.id.toString())) {
                                    dojo.addClass(itemDiv, 'stockitem_unselectable_singlecard');
                                }
                            });
                        }

                        if (court.items.length < 3) {
                            hand.items.forEach(item => {
                                const itemDiv = $(`${hand.container_div.id}_item_${item.id}`);
                                if (this.getCardType(item.id) === 'Princess') {
                                    dojo.addClass(itemDiv, 'stockitem_unselectable_singlecard');
                                }
                            });
                        }

                    });
                    break;
                case 'selectionKnight':
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
                    // Enable selection only in current player's hand
                    Object.values(this.playerStocks).forEach(({ hand, court }) => {
                        const isCurrentPlayer = hand.ownerPlayerId === this.player_id;
                        const isActive = this.isCurrentPlayerActive();
                        hand.setSelectionMode(isCurrentPlayer && isActive ? 1 : 0);
                        court.setSelectionMode(0); // Never select from courts
                    });
                    break;
                case 'selectionTraderOpponent':
                    // Enable selection only in current player's hand
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

                            if (higherInfluenceCards.length > 0) {
                                // Add CSS classes to non-Squires
                                hand.items.forEach(item => {
                                    const itemDiv = $(`${hand.container_div.id}_item_${item.id}`);
                                    if (!higherInfluenceCards.includes(item.id.toString())) {
                                        dojo.addClass(itemDiv, 'stockitem_unselectable_singlecard');
                                    }
                                });
                            } else {
                                hand.items.forEach(item => {
                                    const itemDiv = $(`${hand.container_div.id}_item_${item.id}`);
                                    const itemType = this.getCardType(item.id);
                                    if (cardInformation[itemType].influence != highestInfluence || item.id == blockedCard) {
                                        dojo.addClass(itemDiv, 'stockitem_unselectable_singlecard');
                                    }
                                });
                            }
                        }
                    });
                    break;
                case 'selectionScholar':
                    // Enable selection only in target player's court
                    Object.values(this.playerStocks).forEach(({ hand, court }) => {
                        const isTargetPlayer = this.gamedatas.targetPlayer == hand.ownerPlayerId;
                        const isActive = this.isCurrentPlayerActive();
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

                            if (validCardsUnderFive > 0) {
                                // Add CSS classes to non-Squires
                                court.items.forEach(item => {
                                    const itemDiv = $(`${court.container_div.id}_item_${item.id}`);
                                    if (!validCardsUnderFive.includes(item.id.toString())) {
                                        dojo.addClass(itemDiv, 'stockitem_unselectable_singlecard');
                                    }
                                });
                            } else {
                                court.items.forEach(item => {
                                    const itemDiv = $(`${court.container_div.id}_item_${item.id}`);
                                    if (!validCardsAll.includes(item.id.toString())) {
                                        dojo.addClass(itemDiv, 'stockitem_unselectable_singlecard');
                                    }
                                });
                            }
                        }
                    });
                    break;       
                case 'selectionPriestFirst':
                    playedSquireIds = this.gamedatas.cards
                    .filter(item => item.card_type === 'Squire' && item.card_location === 'court')
                    .map(squire => squire.card_id.toString());
    
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
                        if (playedSquireIds.length > 0 && squireIds.length > 0) {
                            // Add CSS classes to non-Squires
                            hand.items.forEach(item => {
                                const itemDiv = $(`${hand.container_div.id}_item_${item.id}`);
                                if (!squireIds.includes(item.id.toString())) {
                                    dojo.addClass(itemDiv, 'stockitem_unselectable_singlecard');
                                }
                            });
                        }
    
                        if (court.items.length < 3) {
                            hand.items.forEach(item => {
                                const itemDiv = $(`${hand.container_div.id}_item_${item.id}`);
                                if (this.getCardType(item.id) === 'Princess') {
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
                    // Enable selection only in target player's court
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
                                if (!validCardsAll.includes(item.id.toString())) {
                                    dojo.addClass(itemDiv, 'stockitem_unselectable_singlecard');
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
                    });
                });
            }
            if (stateName === 'selectionScholar' || stateName === 'selectionPriestSecond') {
                Object.values(this.playerStocks).forEach(({ court }) => {
                    court.items.forEach(item => {
                        const itemDiv = $(`${court.container_div.id}_item_${item.id}`);
                        dojo.removeClass(itemDiv, 'stockitem_unselectable_singlecard');
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
                  your kingofwoods.game.php file.
        
        */
        setupNotifications: function()
        {
            console.log( 'notifications subscriptions setup' );
            
            // TODO: here, associate your game notifications with local methods
            
            // Example 1: standard notification handling
            // dojo.subscribe( 'cardPlayed', this, "notif_cardPlayed" );
            
            // Example 2: standard notification handling + tell the user interface to wait
            //            during 3 seconds after calling the method in order to let the players
            //            see what is happening in the game.
            // dojo.subscribe( 'cardPlayed', this, "notif_cardPlayed" );
            // this.notifqueue.setSynchronous( 'cardPlayed', 3000 );
            // 

            dojo.subscribe('cardMoved', this, notif => {
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
                console.log('Cards Notif:', cards);
                this.updateCardDisplay(cards);
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

            dojo.subscribe('newRound', this, notif => {
                //Update Global Scores
                this.gamedatas.currentRound = notif.args.currentRound + 1;
                Object.values(notif.args.scores).forEach(player => {
                    this.gamedatas.players[player.id].rounds_before_points = player.rounds_before_points;
                    this.gamedatas.players[player.id].rounds_won = player.rounds_won;
                });
                this.initializePlayerPanels();

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
        
        // TODO: from this point and below, you can write your game notifications handling methods
        
        /*
        Example:
        
        notif_cardPlayed: function( notif )
        {
            console.log( 'notif_cardPlayed' );
            console.log( notif );
            
            // Note: notif.args contains the arguments specified during you "notifyAllPlayers" / "notifyPlayer" PHP call
            
            // TODO: play the card in the user interface.
        },    
        
        */

        notif_score: function(notif) {
            this.scoreCtrl[notif.args.player_id].setValue(notif.args.player_score);
        },
   });             
});
