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

        initializePlayerStocks: function(players) {
            const playerTables = document.getElementById('player-tables');
            Object.values(players).forEach(player => {
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

        configureStock: function(stock) {
            stock.setSelectionAppearance('none');
            stock.image_items_per_row = 4;
            stock.item_image_url = g_gamethemeurl + 'img/KotW_Cards_Spreadsheet.jpg';
            
            // Calculate scaled dimensions
            const cardScale = 0.20; // Start with 30% size
            const baseCardWidth = 768;
            const baseCardHeight = 1181;
            const baseSpriteWidth = 3072;
            const baseSpriteHeight = 3543;
            const scaledCardWidth = baseCardWidth * cardScale;
            const scaledCardHeight = baseCardHeight * cardScale;
            const scaledSpriteWidth = baseSpriteWidth * cardScale;
            const scaledSpriteHeight = baseSpriteHeight * cardScale;
            // Resize stock items
            stock.resizeItems(
                scaledCardWidth,                   // Display width
                scaledCardHeight,                  // Display height
                scaledSpriteWidth,            // Original sprite width
                scaledSpriteHeight            // Original sprite height
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

            cardInformation = {
                'Assassin': {
                    'type' : 1,
                    'name' : _('Assassin'),
                    'influence' : 0,
                    'text' : _("Cover 1 card at any court. If you cover another Assassin, discard both."),
                },
                'Trader': {
                    'type' : 2,
                    'name' : _('Trader'),
                    'influence' : 1,
                    'text' : _("Intrigue: Give this player facedown 1 card from your hand. They have to return 1 card with higher influence (or the highest)."),
                },
                'Guard': {
                    'type' : 3,
                    'name' : _('Guard'),
                    'influence' : 2,
                    'text' : _("At this court, an Assassin can only cover a Guard."),
                },
                'Squire': {
                    'type' : 4,
                    'name' : _('Squire'),
                    'influence' : 2,
                    'text' : _("If there is already a Squire at any court, you have to play this card. If another player‘s Knight steals a card from your hand, it has to be the Squire."),
                },
                'Scholar': {
                    'type' : 5,
                    'name' : _('Scholar'),
                    'influence' : 3,
                    'text' : _("Intrigue: Take a card with influence 4 or smaller (not the Assassin or the Scholar) from this court to your hand. If not possible, take a card with influence 5 or greater."),
                },
                'Priest': {
                    'type' : 6,
                    'name' : _('Priest'),
                    'influence' : 3,
                    'text' : _("You may put an additional card to the same court in order to take 1 card with lowerinfl uence from there to your hand (not the Assassin or the Jester)."),
                },
                'Jester': {
                    'type' : 7,
                    'name' : _('Jester'),
                    'influence' : 4,
                    'text' : _("A court with exactly 3 Jesters has no influence at all."),
                },
                'Treasurer': {
                    'type' : 8,
                    'name' : _('Treasurer'),
                    'influence' : 4,
                    'text' : _("Intrigue: Draw 1 card from this player‘s hand."),
                },
                'Knight': {
                    'type' : 9,
                    'name' : _('Knight'),
                    'influence' : 5,
                    'text' : _("Intrigue: Look at this person‘s hand cards and take 1. If there is a Squire among the cards, you have to take him."),
                },
                'General': {
                    'type' : 10,
                    'name' : _('General'),
                    'influence' : 6,
                    'text' : _("Intrigue: Exchange your hand cards with this player."),
                },
                'Princess': {
                    'type' : 11,
                    'name' : _('Princess'),
                    'influence' : 7,
                    'text' : _("You can only play her if there are at least 3 uncovered cards at your court. The Princess always breaks ties in her favour."),
                },
                'Backside': {
                    'type' : 12,
                    'name' : _('Backside'),
                    'influence' : 0,
                    'text' : _("This is the backside of the card. What could be behind it?"),
                },
            };

            stock.onItemCreate = (itemDiv, itemType, itemId) => {
                const cardType = Object.keys(this.cardTypeMap).find(
                    key => this.cardTypeMap[key] === itemType
                );
                
                if (cardType) {
                    const tooltipHTML = `
                        <div class="card-tooltip">
                            <div class="tooltip-header">
                                <strong>${cardInformation[cardType].name}</strong>
                                <div class="influence">Influence: ${cardInformation[cardType].influence}</div>
                            </div>
                            <div class="tooltip-text">${cardInformation[cardType].text}</div>
                        </div>
                    `;
                    this.addTooltip(itemDiv.id, tooltipHTML);
                }
            };

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

                if (!toStock) return;

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
            
            // Add buttons for each player
            Object.values(players).forEach(player => {
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
            // Clear previous buttons
            this.statusBar.removeActionButtons()
            const cardStock = this.findCardStock(cardId);
            cardStock.selectItem(cardId);
            this.showPlayerTargets(cardId);
        },

        confirmCardPlay: function(cardId, targetPlayerId) {
            this.bgaPerformAction("actPlayCard", {
                card_id: cardId,
                target_player_id: targetPlayerId
            }).then(() => {
                this.clearSelection();
            });
        },
        
        cancelCardSelection: function() {
            // Refresh action buttons to default state
            this.clearSelection();
            this.statusBar.removeActionButtons()
            this.onUpdateActionButtons('playerTurn', this.gamedatas.actionArgs);
        },
        
        clearSelection: function() {
            this.unselectAllCards();
            this.statusBar.removeActionButtons()
        },

        // Update stock selection mode dynamically:
        onEnteringState: function(stateName, args) {
            switch(stateName) {
                case 'playerTurn':
                    const currentPlayerStocks = this.playerStocks[this.player_id];
                    
                    // Enable selection only in current player's hand
                    Object.values(this.playerStocks).forEach(({ hand, court }) => {
                        const isCurrentPlayer = hand.ownerPlayerId === this.player_id;
                        const isActive = this.isCurrentPlayerActive();
                        hand.setSelectionMode(isCurrentPlayer && isActive ? 1 : 0);
                        court.setSelectionMode(0); // Never select from courts
                    });
                    break;
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
                
                this.updateCardDisplay(cards);
            });
            this.notifqueue.setSynchronous('cardMoved', 500);
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
   });             
});
