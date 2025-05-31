import './fonts.scss'
import Game from './game/game'
import DefaultWorld from './game/worlds/default.world'
import './global.scss'
import startPhoneGame from './phone'

if (window.innerHeight > window.innerWidth) startPhoneGame()
else
  new Game(
    document.querySelector('canvas')!,
    [
      '/game/tilesets/1_Generic_16x16.png',
      '/game/tilesets/1_Terrains_and_Fences_16x16.png',
      '/game/tilesets/2_City_Terrains_16x16.png',
      '/game/tilesets/2_LivingRoom_16x16.png',
      '/game/tilesets/3_Bathroom_16x16.png',
      '/game/tilesets/3_City_Props_16x16.png',
      '/game/tilesets/4_Bedroom_16x16.png',
      '/game/tilesets/4_Generic_Buildings_16x16.png',
      '/game/tilesets/5_Classroom_and_library_16x16.png',
      '/game/tilesets/5_Floor_Modular_Buildings_16x16.png',
      '/game/tilesets/6_Garage_Sales_16x16.png',
      '/game/tilesets/6_Music_and_sport_16x16.png',
      '/game/tilesets/7_Art_16x16.png',
      '/game/tilesets/7_Villas_16x16.png',
      '/game/tilesets/8_Gym_16x16.png',
      '/game/tilesets/8_Worksite_16x16.png',
      '/game/tilesets/9_Fishing_16x16.png',
      '/game/tilesets/9_Shopping_Center_and_Markets_16x16.png',
      '/game/tilesets/10_Birthday_party_16x16.png',
      '/game/tilesets/10_Vehicles_16x16.png',
      '/game/tilesets/11_Camping_16x16.png',
      '/game/tilesets/11_Halloween_16x16.png',
      '/game/tilesets/12_Hotel_and_Hospital_16x16.png',
      '/game/tilesets/12_Kitchen_16x16.png',
      '/game/tilesets/13_Conference_Hall_16x16.png',
      '/game/tilesets/13_School_16x16.png',
      '/game/tilesets/14_Basement_16x16.png',
      '/game/tilesets/14_Swimming_Pool_16x16.png',
      '/game/tilesets/15_Christmas_16x16.png',
      '/game/tilesets/15_Police_Station_16x16.png',
      '/game/tilesets/16_Grocery_store_16x16.png',
      '/game/tilesets/16_Office_16x16.png',
      '/game/tilesets/17_Garden_16x16.png',
      '/game/tilesets/17_Visibile_Upstairs_System_16x16.png',
      '/game/tilesets/18_Fire_Station_16x16.png',
      '/game/tilesets/18_Jail_16x16.png',
      '/game/tilesets/19_Graveyard_16x16.png',
      '/game/tilesets/19_Hospital_16x16.png',
      '/game/tilesets/20_Japanese_interiors.png',
      '/game/tilesets/20_Subway_and_Train_Station_16x16.png',
      '/game/tilesets/21_Beach_16x16.png',
      '/game/tilesets/21_Clothing_Store.png',
      '/game/tilesets/22_Museum.png',
      '/game/tilesets/23_Television_and_Film_Studio.png',
      '/game/tilesets/24_Ice_Cream_Shop.png',
      '/game/tilesets/25_Shooting_Range.png',
      '/game/tilesets/26_Condominium.png',
      '/game/tilesets/custom.png',
      '/game/tilesets/Room_Builder_16x16.png',
      '/game/mc.png',
      '/game/ui.png',
      '/game/portraits.png',
      '/game/maps/rodosskaya.json',
      '/game/maps/pyatyorochka.json',
      '/game/maps/wb.json',
      '/game/maps/ozon.json',
      '/game/maps/210.json',
    ],
    (game) => new DefaultWorld(game.canvas, game.resources),
  )

declare global {
  function setTimeout<TArguments extends unknown[]>(
    callback: (...arguments_: TArguments) => void,
    ms?: number,
    ...arguments_: TArguments
  ): number
  function setInterval<TArguments extends unknown[]>(
    callback: (...arguments_: TArguments) => void,
    ms?: number,
    ...arguments_: TArguments
  ): number
}
