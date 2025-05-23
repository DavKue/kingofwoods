<?php
/**
 *------
 * BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
 * TheKingOfTheWoods implementation : © <David Kühn> <david@schusterfilm.de>
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 *
 * states.inc.php
 *
 * TheKingOfTheWoods game states description
 *
 */

/*
   Game state machine is a tool used to facilitate game developpement by doing common stuff that can be set up
   in a very easy way from this configuration file.

   Please check the BGA Studio presentation about game state to understand this, and associated documentation.

   Summary:

   States types:
   _ activeplayer: in this type of state, we expect some action from the active player.
   _ multipleactiveplayer: in this type of state, we expect some action from multiple players (the active players)
   _ game: this is an intermediary state where we don't expect any actions from players. Your game logic must decide what is the next game state.
   _ manager: special type for initial and final state

   Arguments of game states:
   _ name: the name of the GameState, in order you can recognize it on your own code.
   _ description: the description of the current game state is always displayed in the action status bar on
                  the top of the game. Most of the time this is useless for game state with "game" type.
   _ descriptionmyturn: the description of the current game state when it's your turn.
   _ type: defines the type of game states (activeplayer / multipleactiveplayer / game / manager)
   _ action: name of the method to call when this game state become the current game state. Usually, the
             action method is prefixed by "st" (ex: "stMyGameStateName").
   _ possibleactions: array that specify possible player actions on this step. It allows you to use "checkAction"
                      method on both client side (Javacript: this.checkAction) and server side (PHP: $this->checkAction).
   _ transitions: the transitions are the possible paths to go from a game state to another. You must name
                  transitions in order to use transition names in "nextState" PHP method, and use IDs to
                  specify the next game state for each transition.
   _ args: name of the method to call to retrieve arguments for this gamestate. Arguments are sent to the
           client side to be used on "onEnteringState" or to set arguments in the gamestate description.
   _ updateGameProgression: when specified, the game progression is updated (=> call to your getGameProgression
                            method).
*/

//    !! It is not a good idea to modify this file when a game is running !!


$machinestates = [

    // The initial state. Please do not modify.

    1 => array(
        "name" => "gameSetup",
        "description" => "",
        "type" => "manager",
        "action" => "stGameSetup",
        "transitions" => ["" => 2]
    ),

    // Note: ID=2 => your first state

    02 => [
        "name" => "dealCards",
        "description" => '',
        "type" => "game",
        "action" => "stDealCards",
        "updateGameProgression" => true,
        "transitions" => ["nextPlayer" => 11]
    ],


    10 => [
        "name" => "playerTurn",
        "description" => clienttranslate('${actplayer} must play a card'),
        "descriptionmyturn" => clienttranslate('${you} must play a card'),
        "type" => "activeplayer",
        "possibleactions" => [
            // these actions are called from the front with bgaPerformAction, and matched to the function on the game.php file
            "actPlayCard"
        ],
        "transitions" => ["nextPlayer" => 11, "playedKnight" => 12, "playedTrader" => 13, "playedScholar" => 15, "playedPriest" => 16, "zombieTurn" => 80]
    ],

    11 => [
        "name" => "nextPlayer",
        "description" => '',
        "type" => "game",
        "action" => "stNextPlayer",
        "updateGameProgression" => true,
        "transitions" => ["playerTurn" => 10, "finishRound" => 50]
    ],

    12 => [
        "name" => "selectionKnight",
        "description" => clienttranslate('Knight: ${actplayer} must choose a card from the selected hand'),
        "descriptionmyturn" => clienttranslate('Knight: ${you} must choose a card from the selected hand'),
        "type" => "activeplayer",
        "possibleactions" => [
            "actSelectionKnight"
        ],
        "transitions" => ["nextPlayer" => 11]
    ],

    13 => [
        "name" => "selectionTraderPlayer",
        "description" => clienttranslate('Trader: ${actplayer} must choose a card to give to target player'),
        "descriptionmyturn" => clienttranslate('Trader: ${you} must choose a card to give to target player'),
        "type" => "activeplayer",
        "possibleactions" => [
            "actSelectionTraderPlayer"
        ],
        "transitions" => ["activatePlayer" => 20]
    ],

    14 => [
        "name" => "selectionTraderOpponent",
        "description" => clienttranslate('Trader: ${actplayer} must give back a card with higher influence (or the highest)'),
        "descriptionmyturn" => clienttranslate('Trader: ${you} must give back a card with higher influence (or the highest)'),
        "type" => "activeplayer",
        "possibleactions" => [
            "actSelectionTraderOpponent"
        ],
        "transitions" => ["backToPreviousPlayer" => 21, "zombieTraderOpponent" => 81]
    ],

    15 => [
        "name" => "selectionScholar",
        "description" => clienttranslate('Scholar: ${actplayer} must choose a card from the selected court'),
        "descriptionmyturn" => clienttranslate('Scholar: ${you} must choose a card from the selected court'),
        "type" => "activeplayer",
        "possibleactions" => [
            "actSelectionScholar"
        ],
        "transitions" => ["nextPlayer" => 11]
    ],

    16 => [
        "name" => "selectionPriestFirst",
        "description" => clienttranslate('Priest: ${actplayer} may play another card to the same court'),
        "descriptionmyturn" => clienttranslate('Priest: ${you} may play another card to the same court'),
        "type" => "activeplayer",
        "possibleactions" => [
            "actSelectionPriestFirst",
            "actPassPriest"
        ],
        "transitions" => ["selectionPriestSecond" => 17, "nextPlayer" => 11]
    ],

    17 => [
        "name" => "selectionPriestSecond",
        "description" => clienttranslate('Priest: ${actplayer} must take a card with lower influence from target court'),
        "descriptionmyturn" => clienttranslate('Priest: ${you} must take a card with lower influence from target court'),
        "type" => "activeplayer",
        "possibleactions" => [
            "actSelectionPriestSecond"
        ],
        "transitions" => ["nextPlayer" => 11]
    ],

    20 => [
        "name" => "activatePlayer",
        "description" => '',
        "type" => "game",
        "action" => "stActivatePlayer",
        "transitions" => ["selectionTraderOpponent" => 14]
    ],

    21 => [
        "name" => "backToPreviousPlayer",
        "description" => '',
        "type" => "game",
        "action" => "stBackToPreviousPlayer",
        "transitions" => ["nextPlayer" => 11]
    ],

    50 => [
        "name" => "finishRound",
        "description" => '',
        "type" => "game",
        "action" => "stFinishRound",
        "transitions" => ["resetRound" => 60, "endGame" => 99]
    ],

    60 => [
        "name" => "resetRound",
        "description" => '',
        "type" => "game",
        "action" => "stResetRound",
        "transitions" => ["dealCards" => 02]
    ],

    80 => [
        "name" => "zombieTurn",
        "description" => '',
        "type" => "game",
        "action" => "stZombieTurn",
        "transitions" => ["nextPlayer" => 11]
    ],

    81 => [
        "name" => "zombieTraderOpponent",
        "description" => '',
        "type" => "game",
        "action" => "stZombieTraderOpponent",
        "transitions" => ["backToPreviousPlayer" => 21]
    ],

    // Final state.
    // Please do not modify (and do not overload action/args methods).
    99 => [
        "name" => "gameEnd",
        "description" => clienttranslate("End of game"),
        "type" => "manager",
        "action" => "stGameEnd",
        "args" => "argGameEnd"
    ],

];



