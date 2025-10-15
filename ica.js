import puppeteer from 'puppeteer';
import fs from 'fs';

/* elements queryselectors */
article = '.offer-card'
article_info_button = '.offer-card__info-container'
title = '.ids-modal-base__title'
price = '.price-splash__text__firstValue'
cents = '.price-splash__text__secondaryValue'
unit = '.price-splash__text__suffix'
deal = '.price-splash__text__prefix'
size = '.detailsContainerInner' /* 3 */
brand = '.detailsContainerInner' /* 2 */
comparisonPrice = '.detailsContainerInner' /* 4 */
image = '.innerImageContainer.image'
isMember = '.price-splash__icon price-splash__icon--stammis'
hasVariats = '.articleList' /* ul that contains the variants. if the lenght is 1 then false */


