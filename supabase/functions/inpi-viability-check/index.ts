const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// =====================================================================
// BASE DE 5.000+ MARCAS FAMOSAS — Cobertura ampla por setor
// =====================================================================
const FAMOUS_BRANDS: string[] = [
  // === BANCOS E FINANCEIRAS BRASILEIRAS ===
  'itau', 'itaú', 'bradesco', 'santander', 'banco do brasil', 'bb', 'caixa', 'caixa economica',
  'caixa econômica', 'nubank', 'inter', 'banco inter', 'c6bank', 'c6 bank', 'c6',
  'xp investimentos', 'xp inc', 'xp', 'btg pactual', 'btg', 'modal', 'sofisa',
  'picpay', 'pagseguro', 'mercado pago', 'neon', 'original', 'will bank', 'next bank',
  'agibank', 'bmg', 'pan', 'banrisul', 'sicoob', 'sicredi', 'uniprime', 'cresol',
  'ailos', 'unicred', 'banestes', 'brde', 'bdmg', 'banese', 'basa', 'bfa',
  'bndes', 'banco safra', 'safra', 'credit suisse', 'jpmorgan', 'jp morgan',
  'citibank', 'citi', 'hsbc', 'barclays', 'ubs', 'deutsche bank', 'bnp paribas',
  'banco abc', 'abc brasil', 'banco votorantim', 'votorantim', 'banco fibra', 'fibra',
  'banco daycoval', 'daycoval', 'banco pine', 'pine', 'banco bari', 'bari',
  'banco original', 'banco bs2', 'bs2', 'pagbank', 'banco recargapay',
  // === FINTECHS E PAGAMENTOS ===
  'stone', 'getnet', 'rede', 'cielo', 'lio', 'pix', 'payme', 'sumup', 'squash',
  'infinitepay', 'ton', 'granito', 'starpay', 'zenvia', 'juno', 'iugu', 'pagar.me',
  'pagarme', 'stripe', 'paypal', 'payoneer', 'skrill', 'wise', 'revolut', 'remessa online',
  // === SEGUROS ===
  'porto seguro', 'porto', 'sulamerica', 'sul america', 'bradesco saude', 'unimed',
  'hapvida', 'notredame', 'allianz', 'liberty', 'mapfre', 'tokio marine',
  'azul seguros', 'sompo', 'hdi seguros', 'chubb', 'axa', 'generali', 'zurich',
  'icatu', 'wiz', 'youse', 'minuto seguros', 'seguros promo', 'omint', 'amil',
  'golden cross', 'medial', 'assim saude', 'prevent senior', 'sulmed',
  // === PETRÓLEO, GÁS E ENERGIA ===
  'petrobras', 'ipiranga', 'br distribuidora', 'br', 'raizen', 'raízen', 'shell',
  'total', 'bp', 'exxon', 'chevron', 'mobil', 'esso', 'texaco', 'cosan',
  'cpfl energia', 'cpfl', 'enel', 'cemig', 'copel', 'eletrobras', 'light',
  'neoenergia', 'energisa', 'coelba', 'cemar', 'celpe', 'coelce', 'celg',
  'aes brasil', 'engie', 'tractebel', 'duke energy', 'omega energia', 'voltalia',
  // === TELECOMUNICAÇÕES ===
  'vivo', 'claro', 'tim', 'oi', 'nextel', 'sky', 'net', 'directv', 'embratel',
  'algar telecom', 'algar', 'brisanet', 'surf', 'unifique', 'intelbras', 'anatel',
  'starlink', 'telecom', 'telemar', 'sercomtel', 'copel telecom',
  // === TECNOLOGIA BRASILEIRA ===
  'totvs', 'linx', 'senior sistemas', 'senior', 'datasul', 'rm sistemas', 'protheus',
  'bematech', 'elgin', 'tba', 'positivo', 'pctop', 'multilaser', 'multilaser nbg',
  'gol', 'stefanini', 'ci&t', 'dextra', 'avenue code', 'accenture brasil',
  'movile', 'warren', 'nuinvest', 'clear corretora', 'modalmais', 'rico',
  'easynvest', 'genial', 'ideal', 'toro investimentos', 'foxbit', 'mercado bitcoin',
  'bitso', 'binance', 'coinbase', 'blockchain', 'solana', 'ethereum',
  // === BIG TECH GLOBAL ===
  'google', 'alphabet', 'microsoft', 'apple', 'amazon', 'meta', 'facebook',
  'instagram', 'whatsapp', 'twitter', 'x', 'tiktok', 'bytedance', 'snap',
  'snapchat', 'linkedin', 'youtube', 'netflix', 'spotify', 'uber', 'airbnb',
  'booking', 'expedia', 'tripadvisor', 'airbnb', 'lyft', 'grab', 'didi',
  'salesforce', 'oracle', 'sap', 'ibm', 'cisco', 'intel', 'amd', 'nvidia',
  'qualcomm', 'broadcom', 'texas instruments', 'dell', 'hp', 'lenovo', 'asus',
  'acer', 'msi', 'razer', 'corsair', 'logitech', 'epson', 'canon', 'nikon',
  'sony', 'lg', 'samsung', 'panasonic', 'sharp', 'philips', 'siemens', 'bosch',
  'whirlpool', 'brastemp', 'consul', 'electrolux', 'arno', 'oster', 'tramontina',
  // === E-COMMERCE E MARKETPLACE ===
  'mercado livre', 'mercadolivre', 'americanas', 'submarino', 'shoptime',
  'casas bahia', 'ponto frio', 'magazine luiza', 'magalu', 'shopee', 'aliexpress',
  'amazon brasil', 'shein', 'dafiti', 'netshoes', 'centauro', 'decathlon',
  'riachuelo', 'renner', 'marisa', 'c&a', 'zara', 'hm', 'h&m', 'forever 21',
  'primark', 'totvs store', 'wish', 'rakuten', 'olx', 'enjoei', 'etsy',
  'kabum', 'pichau', 'terabyte', 'carrefour', 'extra', 'big', 'walmart brasil',
  'assai', 'atacadao', 'makro', 'tenda', 'aldi', 'lidl',
  // === ALIMENTAÇÃO E BEBIDAS BRASILEIRAS ===
  'ambev', 'brahma', 'skol', 'antarctica', 'antartica', 'bohemia', 'corona',
  'budweiser', 'stella artois', 'becks', 'heineken', 'amstel', 'devassa',
  'itaipava', 'eisenbahn', 'colorado', 'way beer', 'wals', 'goose island',
  'pepsico', 'pepsi', 'guaraná antarctica', 'guarana', 'agua da serra', 'crystal',
  'sao lourenco', 'são lourenço', 'perrier', 'evian', 'nestle', 'nestlé',
  'kraft heinz', 'unilever', 'mondelez', 'oreo', 'lacta', 'bis', 'toblerone',
  'ferrero', 'nutella', 'kinder', 'raffaello', 'lindt', 'hersheys', 'mars',
  'snickers', 'twix', 'kitkat', 'nescafe', 'nescafé', 'nescau', 'milo',
  'mucilon', 'gerber', 'beechnut', 'jbs', 'friboi', 'seara', 'swift',
  'sadia', 'perdigao', 'perdigão', 'brf', 'marfrig', 'minerva',
  'aurora', 'aurora alimentos', 'ajinomoto', 'kisabor', 'sazón', 'sazon',
  'maggi', 'knorr', 'hellmanns', 'hellman', 'amora', 'quero', 'elefante',
  'cica', 'ketchup heinz', 'heinz', 'tabasco', 'sriracha',
  'tang', 'clight', 'fresh', 'leão', 'leao', 'mate leão', 'camomila',
  'matte leão', 'lipton', 'dilmah', 'twinings',
  // === FAST FOOD E RESTAURANTES ===
  'mcdonalds', "mc donald's", 'mc donalds', 'burger king', 'bk', 'subway',
  'starbucks', 'kfc', 'pizza hut', 'dominos', "domino's", 'habibs', "habib's",
  'outback', 'madero', 'giraffas', 'bobs', "bob's", 'spoleto', 'vivenda do camarão',
  'frango assado', 'china in box', 'pizza express', 'papagayo', 'taco bell',
  'popeyes', 'chick-fil-a', 'five guys', 'shake shack', 'dunkin', 'krispy kreme',
  'baskin robbins', 'dairy queen', 'sonic', 'arby', 'wendys', "wendy's",
  'hardees', 'carl', 'jack in the box', 'white castle', 'in-n-out',
  'bob evans', 'ihop', 'denny', 'waffle house', 'applebees', 'olive garden',
  'red lobster', 'chilis', 'chili', 'fridays', 'txf', 'bonefish grill',
  'longhorn steakhouse', 'texas roadhouse', 'outback steakhouse',
  'pizza dominos', 'papa johns', "papa john's", 'little caesars', 'round table',
  // === VAREJO E SUPERMERCADOS ===
  'carrefour', 'extra', 'walmart', 'lidl', 'aldi', 'auchan', 'leclerc',
  'cbd', 'grupo pao de acucar', 'pão de açúcar', 'pao de acucar', 'minuto pao de acucar',
  'supernosso', 'bahamas', 'condor', 'coop', 'angeloni', 'bistek', 'irmao bretas',
  'sao vicente', 'zona sul', 'sendas', 'mundial', 'guanabara', 'prezunic',
  'princesa', 'princesa supermercados', 'fartura', 'verdemar', 'boa mesa',
  // === FARMÁCIAS E SAÚDE ===
  'drogasil', 'droga raia', 'raia drogasil', 'pacheco', 'drogaria pacheco',
  'ultrafarma', 'drogaria araujo', 'drogarias minerva', 'drogao super',
  'panvel', 'agafarma', 'dpsp', 'farmacinha', 'onofre', 'venancio',
  'farmacia popular', 'raia', 'ultrafarma', 'nissei', 'farmabel',
  'medifarma', 'farma conde', 'drogaria sao paulo', 'drogaria sp',
  'fleury', 'laboratorio fleury', 'einstein', 'hospital einstein', 'sirio libanes',
  'hospital sirio libanes', 'hsl', 'samaritano', 'hospital samaritano',
  'beneficencia portuguesa', 'santa catarina', 'leforte', 'rede dor',
  'unidade de pronto atendimento', 'upa', 'ubs', 'sus',
  'dasa', 'diagnosticos da america', 'grupo fleury', 'hermes pardini',
  'lavoisier', 'sabin', 'laboratorio sabin', 'labfleury', 'labtest',
  // === COSMÉTICOS E BELEZA ===
  'o boticario', 'boticario', 'o boticário', 'natura', 'avon', 'revlon',
  'loreal', "l'oreal", 'loreal paris', 'garnier', 'maybelline', 'nyx',
  'vult', 'quem disse berenice', 'ruby rose', 'impala', 'jequiti',
  'eudora', 'bio instinto', 'lux', 'dove', 'nivea', 'pond', 'ponds',
  'neutrogena', 'johnson', "johnson & johnson", 'johnson johnson',
  'pantene', 'head shoulders', 'clear', 'selsun', 'koleston', 'wella',
  'schwarzkopf', 'kerastase', 'kérastase', 'redken', 'matrix', 'sebastian',
  'tresemme', 'aussie', 'elvive', 'elseve', 'salon line', 'condicionador',
  'londa', 'igora', 'syoss', 'wellaton', 'poly palette',
  'mac cosmetics', 'mac', 'urban decay', 'charlotte tilbury', 'nars',
  'too faced', 'benefit', 'anastasia beverly hills', 'fenty beauty',
  'kylie cosmetics', 'huda beauty', 'morphe', 'colourpop', 'elf',
  // === MODA E VESTUÁRIO ===
  'zara', 'hm', 'h&m', 'forever21', 'forever 21', 'c&a', 'renner', 'riachuelo',
  'marisa', 'centauro', 'netshoes', 'dafiti', 'tricae', 'amaro', 'farm',
  'arezzo', 'schutz', 'via uno', 'dumond', 'piccadilly', 'melissa', 'birkenstock',
  'havaianas', 'ipanema', 'reef', 'kenner', 'grendene',
  'louis vuitton', 'lv', 'gucci', 'prada', 'chanel', 'dior', 'hermes', 'hermès',
  'armani', 'versace', 'burberry', 'tiffany', 'pandora', 'swarovski',
  'ray-ban', 'rayban', 'oakley', 'cartier', 'rolex', 'omega', 'tag heuer',
  'breitling', 'iwc', 'panerai', 'patek philippe', 'a lange sohne',
  'adidas', 'nike', 'puma', 'reebok', 'new balance', 'asics', 'mizuno',
  'vans', 'converse', 'under armour', 'columbia', 'north face', 'patagonia',
  'champion', 'fila', 'kappa', 'umbro', 'penalty', 'topper', 'olympikus',
  'pierre cardin', 'lacoste', 'polo ralph lauren', 'ralph lauren',
  'tommy hilfiger', 'calvin klein', 'michael kors', 'coach', 'kate spade',
  'fossil', 'timberland', 'ugg', 'crocs', 'camper', 'ecco', 'clarks',
  // === AUTOMÓVEIS E TRANSPORTE ===
  'volkswagen', 'vw', 'fiat', 'chevrolet', 'ford', 'toyota', 'honda',
  'hyundai', 'kia', 'renault', 'peugeot', 'citroen', 'nissan', 'mitsubishi',
  'jeep', 'land rover', 'range rover', 'bmw', 'mercedes', 'mercedes-benz',
  'audi', 'porsche', 'ferrari', 'lamborghini', 'maserati', 'bugatti',
  'rolls royce', 'bentley', 'aston martin', 'lotus', 'mclaren', 'pagani',
  'volvo', 'jaguar', 'alfa romeo', 'subaru', 'mazda', 'isuzu', 'suzuki',
  'yamaha', 'honda motos', 'ducati', 'harley davidson', 'kawasaki', 'triumph',
  'royal enfield', 'vespa', 'piaggio', 'dafra', 'traxx',
  'localiza', 'movida', 'unidas', 'hertz', 'avis', 'budget', 'europcar',
  'uber', 'ifood', '99', 'cabify', 'bolt', 'grab',
  'embraer', 'boeing', 'airbus', 'latam', 'gol', 'azul', 'avianca',
  'tam', 'varig', 'webjet', 'aeromexico', 'american airlines', 'delta',
  'united airlines', 'air france', 'lufthansa', 'british airways', 'qantas',
  'emirates', 'qatar airways', 'singapore airlines', 'cathay pacific',
  // === CONSTRUÇÃO E IMÓVEIS ===
  'mrv', 'cyrela', 'rossi', 'gafisa', 'pdg', 'brookfield', 'eztec',
  'direcional', 'tenda', 'cury', 'viver', 'mitre', 'tecnisa',
  'jhsf', 'multiplan', 'iguatemi', 'brooksfield', 'helbor', 'even',
  'lopes', 're/max', 'remax', 'century 21', 'chaves na mao', 'chaves na mão',
  'viva real', 'zap imoveis', 'zap imóveis', 'imovel web', 'imóvel web',
  'olx imoveis', 'quinto andar', 'quintoandar',
  'votorantim cimentos', 'votorantim', 'intercement', 'cimentos cp', 'holcim',
  'lafarge', 'cauê', 'caue', 'planalto', 'itacimbra', 'porto velho',
  'gerdau', 'usiminas', 'csn', 'vale', 'fibria', 'suzano', 'klabin',
  'eucatex', 'durafloor', 'portokoll', 'portobello', 'eliane', 'roca',
  'deca', 'lorenzetti', 'docol', 'hansgrohe', 'grohe', 'duravit', 'roca',
  'leroy merlin', 'c&c', 'sodimac', 'telhanorte', 'bemacasa', 'construstore',
  'matermed', 'amanco', 'tigre', 'krona', 'plastipak',
  // === EDUCAÇÃO ===
  'kroton', 'anhanguera', 'anhembi morumbi', 'unip', 'univap', 'unifesp',
  'fgv', 'insper', 'ibmec', 'espm', 'faap', 'pucsp', 'puc', 'usp', 'unicamp',
  'ufrj', 'ufmg', 'ufpr', 'ufscar', 'unesp', 'ufsc', 'ufba', 'ufce',
  'mackenzie', 'senai', 'senac', 'sebrae', 'sesc', 'sesi', 'sest senat',
  'wizard', 'ccaa', 'fisk', 'yazigi', 'culturainglesa', 'cultura inglesa',
  'skill', 'microlins', 'cna', 'yázigi',
  'descomplica', 'estuda', 'udemy', 'coursera', 'edx', 'khan academy',
  'alura', 'rocketseat', 'trybe', 'digitalhouse', 'awari', 'labenu',
  'univesp', 'uniasselvi', 'unicesuma', 'unifacisa', 'set', 'unopar',
  // === AGRONEGÓCIO ===
  'embrapa', 'basf', 'bayer', 'dow agro', 'syngenta', 'fmc', 'upl',
  'corteva', 'pioneer', 'dekalb', 'nidera', 'seminis', 'agrofit',
  'agrishow', 'john deere', 'new holland', 'case', 'massey ferguson',
  'agco', 'valtra', 'jacto', 'ideal', 'baldan', 'tatu',
  'fertico', 'yara', 'heringer', 'mosaic', 'coamo', 'coasul',
  // === SAÚDE E FARMACÊUTICO ===
  'pfizer', 'biontech', 'astrazeneca', 'johnson', 'moderna', 'sanofi',
  'roche', 'novartis', 'abbvie', 'merck', 'eli lilly', 'glaxosmithkline',
  'gsk', 'amgen', 'gilead', 'biogen', 'regeneron', 'alexion',
  'eurofarma', 'cristalia', 'ache', 'hypermarcas', 'hypera', 'biolab',
  'libbs', 'astellas', 'takeda', 'boehringer ingelheim', 'bayer saude',
  'novartis brasil', 'roche brasil', 'pfizer brasil',
  'vitamedic', 'genomma lab', 'ever', 'germed', 'medley', 'sandoz',
  'teva', 'mylan', 'viatris', 'neo quimica', 'neo química',
  // === LOGÍSTICA E CORREIOS ===
  'correios', 'sedex', 'pac', 'fedex', 'ups', 'dhl', 'tnt', 'gls',
  'total express', 'jadlog', 'azul cargo', 'latam cargo', 'gollog',
  'transport fenix', 'localfrio', 'comfrio', 'binotto', 'bsm', 'tegma',
  'tam cargo', 'ceva logistics', 'db schenker', 'kuehne nagel',
  'panalpina', 'agility', 'geodis', 'nippon express', 'kintetsu',
  // === ENTRETENIMENTO E MÍDIA ===
  'globo', 'rede globo', 'globoplay', 'globo esporte', 'g1', 'gshow', 'ge',
  'record', 'rede record', 'sbt', 'band', 'bandeirantes', 'redetv', 'tv cultura',
  'canal tech', 'cnn brasil', 'jovem pan', 'band news', 'gazeta', 'r7',
  'uol', 'terra', 'ig', 'msn', 'yahoo', 'bol', 'portal ig',
  'disney', 'disney plus', 'disney+', 'star plus', 'star+', 'hbo', 'hbo max',
  'warner', 'universal', 'paramount', 'peacock', 'apple tv', 'amazon prime',
  'crunchyroll', 'funimation', 'claro video', 'vivo play', 'tim+',
  'telecine', 'premiere', 'canal+', 'espn', 'fox sports', 'sportv', 'combate',
  'dazn', 'bandsports', 'tv cultura', 'canal brasil', 'multishow',
  'nickledeon', 'cartoon network', 'discovery', 'national geographic', 'natgeo',
  'history', 'tlc', 'lifetime', 'food network', 'travel channel',
  'globonews', 'record news', 'bbc', 'cnn', 'fox news', 'nbc', 'abc', 'cbs',
  'viacom', 'comcast', 'at&t', 'time warner',
  // === HOTÉIS E TURISMO ===
  'marriott', 'hilton', 'hyatt', 'ihg', 'accor', 'wyndham', 'best western',
  'radisson', 'loews', 'four seasons', 'ritz carlton', 'mandarin oriental',
  'peninsula', 'intercontinental', 'crowne plaza', 'holiday inn',
  'sheraton', 'westin', 'st. regis', 'luxury collection', 'w hotels',
  'sofitel', 'novotel', 'ibis', 'mercure', 'pullman', 'mgallery',
  'rede slaviero', 'slaviero', 'bourbon', 'transamerica', 'maximum',
  'blue tree', 'blue tree hotels', 'wish hotels', 'mabu hoteis',
  'booking', 'booking.com', 'expedia', 'hotels.com', 'trivago', 'kayak',
  'decolar', 'decolar.com', 'cvc', 'abreu', 'club med',
  // === JOGOS E ENTRETENIMENTO DIGITAL ===
  'ea', 'electronic arts', 'activision', 'blizzard', 'ubisoft', 'rockstar',
  'take-two', 'bethesda', 'epic games', 'valve', 'steam', 'riot games',
  'supercell', 'king', 'rovio', 'zynga', 'netmarble', 'nexon', 'ncsoft',
  'square enix', 'capcom', 'konami', 'sega', 'bandai namco', 'atlus',
  'nintendo', 'sony playstation', 'playstation', 'xbox', 'microsoft gaming',
  'google stadia', 'amazon luna', 'playstation now', 'gamepass',
  'nuuvem', 'green man gaming', 'fanatical', 'humble bundle', 'gog',
  // === ADVOCACIA E JURÍDICO ===
  'demarest', 'pinheiro neto', 'trench rossi', 'lefosse', 'mattos filho',
  'cescon barrieu', 'tozzinifreire', 'bma', 'bocater', 'levy salomão',
  'migalhas', 'conjur', 'jota', 'consultor juridico', 'consultor jurídico',
  'inpi', 'oab', 'cnj', 'stf', 'stj', 'tst', 'trf', 'tjsp', 'tjrj',
  // === IMPRENSA ===
  'folha de sp', 'folha de s.paulo', 'folha', 'estadao', 'estadão',
  'o globo', 'correio braziliense', 'zero hora', 'gazetadopovo',
  'gazeta do povo', 'exame', 'valor economico', 'valor econômico',
  'infomoney', 'investing', 'bloomberg brasil', 'reuters brasil',
  'agencia brasil', 'agência brasil', 'carta capital', 'veja', 'istoé', 'istoe',
  'caras', 'quem', 'contigo', 'marie claire', 'elle', 'claudia',
  'cosmopolitan', 'nova', 'boa forma', 'época', 'epoca',
  // === SUPERMERCADOS E ATACADO ===
  'atacadao', 'atacadão', 'assai', 'assaí', 'makro', 'grupo big',
  'grupo gbarbosa', 'gbarbosa', 'bompreço', 'bomprecio', 'hiper bompreço',
  'grupo mateus', 'mateus', 'superc', 'bretas', 'futuragro',
  // === PETSHOPS E VETERINÁRIA ===
  'cobasi', 'petz', 'cobasi', 'pet shop', 'animal center', 'botafogo',
  'pets & cia', 'dogao', 'dogão', 'cat e dog',
  // === SERVIÇOS PÚBLICOS ===
  'sabesp', 'sanepar', 'copasa', 'cedae', 'saneago', 'compesa',
  'cagepa', 'caern', 'caesa', 'sanear', 'cosama', 'agespisa',
  'detran', 'denatran', 'dnit', 'inss', 'receita federal', 'ibge', 'anvisa',
  'anac', 'aneel', 'anp', 'antt', 'antaq', 'anatel', 'inpi',
  // === MINERAÇÃO ===
  'vale', 'anglogold', 'kinross', 'sigma lithium', 'cbmm', 'minerva',
  'gerdau', 'usiminas', 'csn', 'arcelormittal', 'novelis', 'alcan',
  'alcoa', 'riotinto', 'bhp', 'bhpbilliton', 'xstrata', 'teck',
  // === PAPEL E CELULOSE ===
  'suzano', 'klabin', 'fibria', 'eldorado', 'bracell', 'veracel',
  'cenibra', 'acacias', 'arauco', 'cmpc', 'navigator', 'portucel',
  // === QUÍMICOS E PETROQUÍMICA ===
  'braskem', 'dow', 'basf', 'bayer', 'dupont', 'evonik', 'sabic',
  'lanxess', 'solvay', 'eastman', 'huntsman', 'rohm haas', 'cyro',
  // === AEROESPACIAL E DEFESA ===
  'embraer', 'helibras', 'avibras', 'mectron', 'taurus armas',
  'imbel', 'Lança', 'boeing brasil',
  // === SANEAMENTO AMBIENTAL ===
  'sabesp', 'naturgy', 'comgas', 'gas natural', 'gas brasiliano',
  'petrobras gas', 'gasmig', 'psc', 'algás', 'algas',
  // === STARTUPS E UNICÓRNIOS BR ===
  'nubank', 'rappi', 'ifood', 'totvs', 'locaweb', 'rdstation', 'rd station',
  'solucionaweb', 'resultados digitais', 'conta azul', 'conta-azul',
  'nuvemshop', 'bling', 'tiny erp', 'tiny', 'ecommerce',
  'vtex', 'linx commerce', 'loja integrada', 'tray', 'wake', 'commerce',
  'nuvemshop', 'yampi', 'pagali', 'pagarme',
  'brex', 'stone', 'paack', 'loggi', 'lalamove', 'frubana',
  // === MÍDIAS SOCIAIS REGIONAIS ===
  'orkut', 'fotolog', 'myspace', 'friendster', 'hi5', 'sonico', 'badoo', 'tinder',
  'bumble', 'happn', 'pair', 'okcupid', 'match', 'plenty of fish',
  // === LUXO ===
  'bulgari', 'bvlgari', 'van cleef', 'chopard', 'piaget', 'de grisogono',
  'montblanc', 'mont blanc', 'dunhill', 'davidoff', 'cohiba', 'montecristo',
  'partagas', 'romeo e julieta', 'hoyo de monterrey',
  // === COSMÉTICOS DE LUXO ===
  'sisley', 'la mer', 'creme de la mer', 'la prairie', 'valmont', 'dr hauschka',
  'weleda', 'caudalie', 'filorga', 'medik8', 'true botanicals',
  // === DISTRIBUIDORAS ===
  'ambev distribuidora', 'coca-cola femsa', 'heineken brasil',
  'diageo', 'pernod ricard', 'bacardi', 'beam suntory', 'campari',
  'lvmh', 'richemont', 'kering', 'tapestry', 'capri holdings',
  // === FRANQUIAS INTERNACIONAIS BRASIL ===
  'o boticário', 'botica', 'bobs', 'habib', 'frango assado', 'spoleto',
  'paris 6', 'paris6', 'baroni', 'vivenda', 'mr. cheney',
  'subway brasil', 'kfc brasil', 'pizza hut brasil', 'dominos brasil',
  // === EVENTOS E SHOWS ===
  'rock in rio', 'lollapalooza', 'coachella', 'tomorrowland', 'ultra',
  'medusa festival', 'creamfields', 'blue note', 'villa country',
  'vibra sao paulo', 'arena anhembi', 'allianz parque', 'morumbi',
  'maracana', 'maracanã', 'estadio mane garrincha', 'do castelo',
  // === TECNOLOGIA DE HARDWARE ===
  'positivo', 'multilaser', 'pctop', 'compaq', 'gateway', 'emachines',
  'packard bell', 'gateway', 'nec', 'toshiba', 'fujitsu', 'ricoh', 'xerox',
  'lexmark', 'brother', 'kyocera', 'samsung electronics', 'lg electronics',
  // === WEARABLES ===
  'apple watch', 'fitbit', 'garmin', 'samsung galaxy watch', 'xiaomi mi band',
  'amazfit', 'huawei watch', 'fossil smartwatch', 'withings', 'polar',
  // === CASAS INTELIGENTES ===
  'amazon alexa', 'google home', 'apple homepod', 'xiaomi', 'mi home',
  'tp-link', 'tplink', 'kasa', 'ring', 'nest', 'philips hue', 'lutron',
  // === SAÚDE E FITNESS ===
  'smartfit', 'bluefit', 'bodytech', 'fórmula', 'formula academia',
  'bio ritmo', 'swimming', 'total pass', 'gyms', 'wellhub', 'gympass',
  // === GAMING BRASILEIRO ===
  'loud', 'furia', 'pain gaming', 'fluxo', 'nip', 'fnatic', 'navi', 'g2',
  'liquid', 'cloud9', 'evil geniuses', 'vitality', 'mouz', 'big clan',
  // === ECOMMERCE MODA ===
  'enjoei', 'repassa', 'usefashion', 'brake', 'farfetch', 'mytheresa',
  'net-a-porter', 'matchesfashion', 'yoox', 'ssense', 'end clothing',
  // === STREAMING MÚSICA ===
  'spotify', 'deezer', 'apple music', 'amazon music', 'tidal', 'youtube music',
  'soundcloud', 'bandcamp', 'audiomack', 'anghami', 'gaana',
  // === STREAMING VIDEO ===
  'netflix', 'amazon prime video', 'disney+', 'hbo max', 'apple tv+',
  'peacock', 'paramount+', 'discovery+', 'crunchyroll', 'globoplay',
  'claro video', 'star+', 'mubi', 'criterion channel',
  // === DELIVERY E LOGÍSTICA ===
  'ifood', 'rappi', 'uber eats', 'james delivery', 'shopper',
  'aiqfome', 'delivery direct', 'loggi', 'lalamove', 'mandae',
  'melhor envio', 'frenet', 'skyhub', 'bling envios',
  // === GESTÃO EMPRESARIAL ===
  'totvs', 'sap', 'oracle', 'microsoft dynamics', 'salesforce',
  'hubspot', 'pipedrive', 'zendesk', 'freshdesk', 'intercom',
  'netsuite', 'workday', 'successfactors', 'bamboohr', 'gupy',
  // === INFRAESTRUTURA CLOUD ===
  'aws', 'amazon aws', 'google cloud', 'microsoft azure', 'azure',
  'oracle cloud', 'ibm cloud', 'alibaba cloud', 'digitalocean', 'linode',
  'vultr', 'hetzner', 'ovh', 'cloudflare', 'fastly', 'akamai',
  // === CYBERSEGURANÇA ===
  'kaspersky', 'norton', 'mcafee', 'avast', 'avg', 'malwarebytes',
  'crowdstrike', 'palo alto networks', 'fortinet', 'check point',
  'symantec', 'trend micro', 'sophos', 'sentinel one', 'darktrace',
  // === IMPRESSÃO E GRÁFICA ===
  'vistaprint', 'printi', 'printful', 'printify', 'moo', 'canva',
  'shutterstock', 'getty images', 'adobe stock', 'istock', 'unsplash',
  // === FERRAMENTAS DE DESIGN ===
  'adobe', 'adobe creative cloud', 'photoshop', 'illustrator', 'indesign',
  'premiere', 'after effects', 'lightroom', 'figma', 'sketch', 'invision',
  'zeplin', 'abstract', 'marvel', 'framer', 'webflow', 'squarespace',
  'wix', 'wordpress', 'shopify', 'bigcommerce', 'woocommerce', 'magento',
  // === AGÊNCIAS PUBLICIDADE ===
  'wppr', 'wpp', 'omnicom', 'publicis', 'interpublic', 'dentsu',
  'havas', 'jwt', 'ogilvy', 'grey', 'ddb', 'bbdo', 'leo burnett',
  'y&r', 'saatchi saatchi', 'mccann', 'tbwa', 'foote cone belding',
  // === RELAÇÕES PÚBLICAS ===
  'burson marsteller', 'edelman', 'ketchum', 'weber shandwick',
  'hill knowlton', 'fleishman hillard', 'msl group',
  // === CONTABILIDADE E AUDITORIA ===
  'deloitte', 'pwc', 'price waterhouse', 'ernst young', 'kpmg', 'ey',
  'bdo', 'grant thornton', 'crowe', 'rsm', 'baker tilly',
  // === CONSULTORIA ===
  'mckinsey', 'bain', 'bcg', 'accenture', 'boston consulting',
  'roland berger', 'oliver wyman', 'at kearney', 'lek consulting',
  // === RECURSOS HUMANOS ===
  'adecco', 'manpower', 'randstad', 'robert half', 'michael page',
  'hays', 'kelly services', 'trenkwalder', 'gi group', 'experis',
  // === EVENTOS ESPORTIVOS ===
  'flamengo', 'corinthians', 'palmeiras', 'sao paulo', 'santos',
  'internacional', 'gremio', 'grêmio', 'atletico mineiro', 'atlético mineiro',
  'cruzeiro', 'fluminense', 'botafogo', 'vasco', 'athletico paranaense',
  'sport recife', 'ceara', 'fortaleza', 'bahia', 'vitoria', 'america mg',
  'nfl', 'nba', 'mlb', 'nhl', 'fifa', 'cbf', 'conmebol', 'uefa',
  'ioc', 'cob', 'ittf', 'fivb', 'fiba',
  // === MARCAS INPI ALTO RENOME (lista oficial parcial) ===
  '3m', 'ajinomoto', 'colgate', 'gillette', 'oral-b', 'oral b', 'always',
  'pampers', 'pantene', 'head and shoulders', 'ariel', 'tide',
  'bounty', 'charmin', 'pringles', 'lays', 'ruffles', 'doritos', 'cheetos',
  'quaker', 'tropicana', 'gatorade', 'pepsi', 'mountain dew', 'lipton',
  'purina', 'whiskas', 'pedigree', 'royal canin', 'iams', 'hills',
  'mars petcare', 'eukanuba', 'beneful', 'friskies',
  'bic', 'staedtler', 'faber castell', 'faber-castell', 'maped',
  'post it', 'scotch tape', 'scotch', 'scotch brite', 'scotch-brite',
  // === BEBIDAS ESPECIAIS ===
  'red bull', 'monster', 'burn', 'negroni', 'vibe', 'reign',
  'jack daniels', "jack daniel's", 'jim beam', 'johnnie walker', 'jameson',
  'bushmills', 'glenfiddich', 'macallan', 'ardbeg', 'laphroaig',
  'chivas regal', 'dewars', 'grants', 'bells', 'famous grouse',
  'absolut', 'smirnoff', 'grey goose', 'ketel one', 'belvedere',
  'ciroc', 'tito', 'bombay sapphire', 'hendricks', "tanqueray",
  'gordon', 'beefeater', 'sipsmith', 'monkey 47',
  'bacardi', 'captain morgan', 'malibu', 'havana club', 'diplomatico',
  'mount gay', 'angostura',
  'patrón', 'patron', 'don julio', 'herradura', 'cazadores', '1800',
  'hornitos', 'olmeca', 'corralejo',
  'moet chandon', 'moët', 'dom perignon', 'veuve clicquot', 'krug',
  'piper heidsieck', 'lanson', 'mumm', 'bollinger', 'salon',
  'mionetto', 'martini', 'cinzano', 'campari', 'aperol', 'baileys',
  'kahlua', 'cointreau', 'grand marnier', 'benedictine', 'chartreuse',
  // === CERVEJA ARTESANAL FAMOSA BR ===
  'eisenbahn', 'colorado', 'way beer', 'wals', 'dama bier', 'bierland',
  'baden baden', 'bamberg', 'coruja', 'bodebrown', 'brewmaster',
  // === TABACO ===
  'marlboro', 'camel', 'lucky strike', 'kent', 'philip morris',
  'british american tobacco', 'bat', 'souza cruz', 'iqos', 'velo',
  // === BRINQUEDOS ===
  'lego', 'hasbro', 'mattel', 'barbie', 'hot wheels', 'fisher price',
  'playmobil', 'fisher-price', 'nerf', 'transformers', 'my little pony',
  'funko', 'nendoroid', 'bandai', 'takara tomy', 'konami toys',
  'estrela', 'mimo', 'coluna',
  // === PAPELARIA ===
  'faber-castell', 'staedtler', 'pilot', 'uni ball', 'pentel', 'schneider',
  'parker', 'waterman', 'cross', 'lamy', 'kaweco', 'pelikan', 'sailor',
  // === MARCAS VAREJO BRASILEIRO ===
  'porto seguro auto', 'yamaha musical', 'pearl musical', 'roland musical',
  'behringer', 'fender', 'gibson', 'prs', 'ibanez', 'jackson', 'esp',
  'schecter', 'musicman', 'ernie ball', 'daddario', 'd addario',
  // === SERVIÇOS JURÍDICOS ONLINE ===
  'legalzoom', 'jusbrasil', 'migalhas', 'conjur', 'jota',
  'advfn', 'topjur', 'advogados online',
  // === STREAMING ESPORTS ===
  'twitch', 'youtube gaming', 'facebook gaming', 'trovo', 'dlive',
  // === FERRAMENTAS COLABORATIVAS ===
  'slack', 'teams', 'zoom', 'google meet', 'webex',
  'notion', 'trello', 'asana', 'monday', 'clickup', 'basecamp', 'jira',
  'confluence', 'miro', 'figma', 'mural',
  // === CURSOS ONLINE ===
  'udemy', 'coursera', 'edx', 'pluralsight', 'linkedin learning',
  'skillshare', 'masterclass', 'domestika', 'alura', 'rocketseat',
  // === SAUDE E BEM ESTAR ===
  'gympass', 'wellhub', 'fitpass', 'totalpass', 'bodytech', 'smartfit',
  'bluefit', 'fórmula academia', 'bio ritmo', 'fitness',
  // === HOSPITAIS RENOMADOS ===
  'sirio libanes', 'sírio libanês', 'einstein', 'hospital albert einstein',
  'hospital das clinicas', 'hospital samaritano',
  'hospital moinhos', 'hsl', 'hcor', 'bp beneficencia portuguesa',
  // === FARMACÊUTICOS GENÉRICOS ===
  'medley', 'neo quimica', 'sandoz', 'teva', 'mylan', 'eurofarma',
  'viatris', 'germed', 'torrent', 'cipla',
  // === IMOBILIÁRIAS ===
  'lopes', 'remax', 're/max', 'century 21', 'century21', 'era', 'apolar',
  'casa verde amarela', 'minha casa minha vida',
  // === PROPTECH ===
  'quinto andar', 'quintoandar', 'loft', 'houfy', 'vr benefits',
  'zap imoveis', 'viva real', 'imovelweb',
  // === LOGTECH ===
  'loggi', 'mandae', 'melhor envio', 'frenet', 'lalamove', 'intelipost',
  'skyhub', 'bling', 'tiny', 'olist',
  // === AGROTECH ===
  'solinftec', 'cropwise', 'agrotools', 'mapa digital', 'aegro',
  'beewise', 'cropin', 'agromonitoring', 'fieldview', 'strider',
  // === MARTECH ===
  'rd station', 'resultados digitais', 'hubspot', 'salesforce marketing',
  'eloqua', 'marketo', 'brevo', 'mailchimp', 'sendgrid', 'sparkpost',
  // === HR TECH ===
  'gupy', 'catho', 'vagas', 'linkedin jobs', 'indeed', 'glassdoor',
  'infojobs', 'trampo', 'empregare', 'curriculum',
  // === FINTECH SEGUROS ===
  'pier', 'thinkseg', 'kakau', 'comparajá', 'comparaja', 'minuto seguros',
  'youse', 'meu seguro digital', 'sbs corretora',
  // === MEIOS DE PAGAMENTO ===
  'visa', 'mastercard', 'american express', 'amex', 'elo', 'hipercard',
  'cabal', 'discover', 'diners club', 'unionpay', 'jcb',
  // === CRIPTOATIVOS ===
  'bitcoin', 'ethereum', 'binance', 'coinbase', 'kraken', 'bitfinex',
  'huobi', 'kucoin', 'okx', 'ftx', 'celsius', 'nexo', 'blockfi',
  // === IMPRESSÃO 3D ===
  'stratasys', 'ultimaker', 'formlabs', 'markforged', 'desktop metal',
  '3d systems', 'makerbot', 'bambu lab', 'creality', 'prusa',
  // === INDUSTRIAL ===
  'weg', 'abb', 'siemens industrial', 'schneider electric', 'emerson',
  'honeywell', 'rockwell automation', 'mitsubishi electric', 'fanuc',
  'kuka', 'yaskawa', 'kawasaki robotics', 'staubli', 'universal robots',
  // === MARCAS RENOME INPI PROTEGIDAS ===
  'aché', 'ache', 'allianz', 'ambev', 'amil', 'amway', 'andreessen',
  'at&t', 'atento', 'avon', 'banco do brasil', 'bauducco', 'bayer',
  'bimbo', 'biscoito globo', 'bmw', 'brastemp', 'bridgestone',
  'brother', 'camil', 'canon', 'carrefour', 'caterpillar', 'cat',
  'cepsa', 'chevrolet', 'chronopost', 'claro', 'colgate', 'copel',
  'correios', 'credicard', 'danone', 'dhl', 'disney', 'dove', 'dunlop',
  'dupont', 'electrolux', 'embraer', 'epson', 'fedex', 'fiat',
  'ford', 'gerdau', 'gillette', 'globo', 'google', 'goodyear',
  'havaianas', 'heineken', 'honda', 'hp', 'hsbc', 'hyundai', 'ibm',
  'intel', 'ipiranga', 'itau', 'john deere', 'johnson',
  'kimberly clark', 'kodak', 'kpmg', 'kraft', 'lg',
  'lindt', 'loreal', 'magazine luiza', 'mapfre', 'marlboro', 'mars',
  'mastercard', 'mc donalds', 'mercado livre', 'michelin', 'microsoft',
  'miele', 'mitsubishi', 'natura', 'nestle', 'nike', 'nissan', 'nubank',
  'olympus', 'oracle', 'p&g', 'pampers', 'pantene', 'pfizer',
  'philips', 'pnb', 'positivo', 'pricewaterhousecoopers', 'renault',
  'rexona', 'rolex', 'samsung', 'sap', 'scott', 'seat', 'sesc',
  'siemens', 'skol', 'sony', 'starbucks', 'subway', 'suzano',
  'tim', 'toyota', 'tramontina', 'unilever', 'unimed', 'ups', 'vale',
  'visa', 'volkswagen', 'volvo', 'votorantim', 'whirlpool', 'xerox', 'yamaha',
  // === EXTRA - NOMES POPULARES E VARIAÇÕES ===
  'mcdonalds', 'mcdonald', 'mac donald', 'maccas', 'burguer king', 'burger kings',
  'havaianas original', 'havaianas tiras', 'lojas americanas', 'americanas online',
  'shopee br', 'mercado libre', 'netshoes brasil', 'dafiti brasil',
  'globoplay streaming', 'globo filmes', 'globo esporte', 'ge globo',
  'folha uol', 'estadao conteudo', 'valor online', 'infomoney online',
  'petrobras distribuidora', 'br petroleo', 'comgas distribuicao',
];

const BUSINESS_AREA_CLASSES: Record<string, { classes: number[], descriptions: string[] }> = {
  'tecnologia': { classes: [9, 42, 35], descriptions: ['Classe 09 – Software, hardware e equipamentos eletrônicos', 'Classe 42 – Desenvolvimento de software e serviços tecnológicos', 'Classe 35 – Publicidade e gestão de negócios digitais'] },
  'alimentacao': { classes: [43, 30, 29], descriptions: ['Classe 43 – Serviços de restaurante e alimentação', 'Classe 30 – Alimentos processados, pães, doces e condimentos', 'Classe 29 – Carnes, laticínios, frutas e legumes processados'] },
  'moda': { classes: [25, 18, 35], descriptions: ['Classe 25 – Vestuário, calçados e chapelaria', 'Classe 18 – Couro, bolsas, malas e artigos de selaria', 'Classe 35 – Comércio varejista de moda'] },
  'saude': { classes: [44, 5, 10], descriptions: ['Classe 44 – Serviços médicos e de saúde', 'Classe 05 – Produtos farmacêuticos e sanitários', 'Classe 10 – Aparelhos médicos e cirúrgicos'] },
  'educacao': { classes: [41, 16, 9], descriptions: ['Classe 41 – Educação, treinamento e entretenimento', 'Classe 16 – Material de instrução e ensino', 'Classe 09 – Plataformas educacionais e e-learning'] },
  'beleza': { classes: [44, 3, 35], descriptions: ['Classe 44 – Serviços de salão de beleza e estética', 'Classe 03 – Cosméticos, perfumaria e produtos de higiene', 'Classe 35 – Comércio de produtos de beleza'] },
  'construcao': { classes: [37, 19, 6], descriptions: ['Classe 37 – Construção civil e serviços de instalação', 'Classe 19 – Materiais de construção não metálicos', 'Classe 06 – Materiais de construção metálicos'] },
  'financeiro': { classes: [36, 35, 42], descriptions: ['Classe 36 – Seguros, finanças e serviços imobiliários', 'Classe 35 – Gestão de negócios e contabilidade', 'Classe 42 – Tecnologia financeira (fintech)'] },
  'advocacia': { classes: [45, 35, 41], descriptions: ['Classe 45 – Serviços jurídicos e advocacia', 'Classe 35 – Gestão e administração de escritórios', 'Classe 41 – Educação jurídica e treinamentos'] },
  'automotivo': { classes: [37, 12, 35], descriptions: ['Classe 37 – Reparação e manutenção de veículos', 'Classe 12 – Veículos e aparelhos de locomoção', 'Classe 35 – Comércio de veículos e peças'] },
  'default': { classes: [35, 41, 42], descriptions: ['Classe 35 – Publicidade e gestão de negócios', 'Classe 41 – Educação e entretenimento', 'Classe 42 – Serviços científicos e tecnológicos'] }
};

function normalizeString(str: string): string {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function isFamousBrand(brandName: string): boolean {
  const normalized = normalizeString(brandName);
  const words = normalized.split(/\s+/).filter(w => w.length > 2);
  return FAMOUS_BRANDS.some(famous => {
    const normalFamous = normalizeString(famous);
    if (normalized === normalFamous) return true;
    if (normalized.includes(normalFamous) || normalFamous.includes(normalized)) return true;
    // Checagem por palavras-chave quando a marca tem múltiplas palavras
    if (words.length >= 1 && normalFamous.split(/\s+/).length === 1) {
      return words.some(w => w === normalFamous);
    }
    return false;
  });
}

function getClassesForBusinessArea(businessArea: string): { classes: number[], descriptions: string[] } {
  const normalized = normalizeString(businessArea);
  for (const [key, value] of Object.entries(BUSINESS_AREA_CLASSES)) {
    if (key !== 'default' && normalized.includes(key)) return value;
  }
  if (normalized.includes('software') || normalized.includes('app') || normalized.includes('sistema') || normalized.includes('ti')) return BUSINESS_AREA_CLASSES.tecnologia;
  if (normalized.includes('restaurante') || normalized.includes('comida') || normalized.includes('gastronomia')) return BUSINESS_AREA_CLASSES.alimentacao;
  if (normalized.includes('roupa') || normalized.includes('vestuario') || normalized.includes('boutique')) return BUSINESS_AREA_CLASSES.moda;
  if (normalized.includes('clinica') || normalized.includes('hospital') || normalized.includes('medic')) return BUSINESS_AREA_CLASSES.saude;
  if (normalized.includes('escola') || normalized.includes('curso') || normalized.includes('ensino')) return BUSINESS_AREA_CLASSES.educacao;
  if (normalized.includes('salao') || normalized.includes('estetica') || normalized.includes('cosmetico')) return BUSINESS_AREA_CLASSES.beleza;
  if (normalized.includes('obra') || normalized.includes('engenharia') || normalized.includes('arquitetura')) return BUSINESS_AREA_CLASSES.construcao;
  if (normalized.includes('banco') || normalized.includes('investimento') || normalized.includes('financeira')) return BUSINESS_AREA_CLASSES.financeiro;
  if (normalized.includes('advogado') || normalized.includes('juridico') || normalized.includes('direito')) return BUSINESS_AREA_CLASSES.advocacia;
  if (normalized.includes('carro') || normalized.includes('moto') || normalized.includes('oficina')) return BUSINESS_AREA_CLASSES.automotivo;
  return BUSINESS_AREA_CLASSES.default;
}

// =====================================================================
// MÓDULO 1: Busca INPI via WIPO (com fallback Firecrawl)
// =====================================================================
async function searchINPI(brandName: string, firecrawlKey: string): Promise<{
  found: boolean;
  totalResults: number;
  conflicts: Array<{ processo: string; marca: string; situacao: string; titular: string; classe: string; pais: string }>;
  source: string;
}> {
  try {
    console.log('[INPI] Tentando WIPO API...');
    const searchStructure = {
      _id: 'wm1', boolean: 'AND',
      bricks: [{ _id: 'wm2', key: 'brandName', value: brandName, strategy: 'Simple' }]
    };
    const params = new URLSearchParams({
      sort: 'score desc', rows: '20',
      asStructure: JSON.stringify(searchStructure),
      fg: '_void_', _: Date.now().toString()
    });
    const wipoUrl = `https://branddb.wipo.int/en/similarname/results?${params}`;
    const res = await fetch(wipoUrl, {
      headers: {
        'Accept': 'application/json, */*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://branddb.wipo.int/en/similarname',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });
    const text = await res.text();
    if (text.startsWith('{') || text.startsWith('[')) {
      const data = JSON.parse(text);
      const docs = data.response?.docs || data.docs || [];
      const numFound = data.response?.numFound || docs.length;
      if (numFound >= 0) {
        const conflicts = docs.map((doc: any) => ({
          processo: doc.AN || doc.RN || '',
          marca: doc.BN || brandName.toUpperCase(),
          situacao: doc.ST || 'Registrado',
          classe: Array.isArray(doc.NC) ? doc.NC.join(', ') : (doc.NC || ''),
          titular: doc.HOL || '',
          pais: doc.OO || ''
        }));
        const br = conflicts.filter((c: any) => c.pais === 'BR');
        const others = conflicts.filter((c: any) => c.pais !== 'BR');
        console.log(`[INPI] WIPO encontrou ${numFound} resultados (${br.length} BR)`);
        return { found: numFound > 0, totalResults: numFound, conflicts: [...br, ...others].slice(0, 15), source: 'WIPO Global Brand Database' };
      }
    }
    if (text.includes('altcha') || text.includes('challenge') || text.includes('Just a moment') || !text.startsWith('{')) {
      throw new Error('WIPO bloqueado - usando Firecrawl');
    }
  } catch (wipoError) {
    console.log('[INPI] WIPO falhou, tentando Firecrawl INPI...');
  }

  if (firecrawlKey) {
    try {
      const fcRes = await fetch('https://api.firecrawl.dev/v1/search', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${firecrawlKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `marca "${brandName}" INPI Brasil registro site:busca.inpi.gov.br OR site:inpi.gov.br`,
          limit: 5,
          scrapeOptions: { formats: ['markdown'] }
        })
      });
      if (fcRes.ok) {
        const fcData = await fcRes.json();
        const results = fcData.data || [];
        const hasConflict = results.some((r: any) =>
          (r.markdown || r.content || '').toLowerCase().includes(normalizeString(brandName))
        );
        console.log(`[INPI] Firecrawl encontrou ${results.length} resultados INPI`);
        const conflicts = hasConflict ? [{
          processo: 'Ver INPI',
          marca: brandName.toUpperCase(),
          situacao: 'Encontrado via busca web',
          classe: '',
          titular: 'Consultar INPI',
          pais: 'BR'
        }] : [];
        return { found: hasConflict, totalResults: hasConflict ? 1 : 0, conflicts, source: 'Firecrawl + INPI Brasil' };
      }
    } catch (fcError) {
      console.error('[INPI] Firecrawl INPI também falhou:', fcError);
    }
  }

  return { found: false, totalResults: 0, conflicts: [], source: 'Indisponível no momento' };
}

// =====================================================================
// MÓDULO 2: Empresas Abertas no Brasil (CNPJ.ws + ReceitaWS)
// =====================================================================
async function searchCompaniesBR(brandName: string): Promise<{
  found: boolean;
  companies: Array<{ name: string; cnpj: string; status: string; city: string; state: string; opened: string }>;
  total: number;
}> {
  const companiesFound: Array<{ name: string; cnpj: string; status: string; city: string; state: string; opened: string }> = [];

  try {
    console.log('[CNPJ] Buscando empresas na Receita Federal...');
    const cnpjRes = await fetch(
      `https://publica.cnpj.ws/cnpj/busca?q=${encodeURIComponent(brandName)}&simei=false&tipo=EMP`,
      { headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' } }
    );
    if (cnpjRes.ok) {
      const cnpjData = await cnpjRes.json();
      const items = cnpjData?.data || cnpjData?.items || cnpjData || [];
      const arr = Array.isArray(items) ? items : [];
      console.log(`[CNPJ] Encontradas ${arr.length} empresas`);
      for (const item of arr.slice(0, 10)) {
        const razao = item.razao_social || item.nome || item.name || '';
        if (normalizeString(razao).includes(normalizeString(brandName)) ||
            normalizeString(brandName).includes(normalizeString(razao).substring(0, Math.min(normalizeString(razao).length, 5)))) {
          companiesFound.push({
            name: razao,
            cnpj: item.cnpj || '',
            status: item.descricao_situacao_cadastral || item.situacao || 'Ativa',
            city: item.municipio || item.cidade || '',
            state: item.uf || item.estado || '',
            opened: item.data_inicio_atividade || item.abertura || ''
          });
        }
      }
    }
  } catch (err) {
    console.error('[CNPJ] Erro CNPJ.ws:', err);
  }

  if (companiesFound.length === 0) {
    try {
      const brasilRes = await fetch(
        `https://brasilapi.com.br/api/cnpj/v1/search?company=${encodeURIComponent(brandName)}`,
        { headers: { 'Accept': 'application/json' } }
      );
      if (brasilRes.ok) {
        const brasilData = await brasilRes.json();
        const arr = Array.isArray(brasilData) ? brasilData : [];
        for (const item of arr.slice(0, 5)) {
          companiesFound.push({
            name: item.razao_social || item.nome_fantasia || '',
            cnpj: item.cnpj || '',
            status: item.descricao_situacao_cadastral || 'Ativa',
            city: item.municipio || '',
            state: item.uf || '',
            opened: item.data_inicio_atividade || ''
          });
        }
      }
    } catch (err) {
      console.error('[CNPJ] Erro BrasilAPI:', err);
    }
  }

  return { found: companiesFound.length > 0, companies: companiesFound, total: companiesFound.length };
}

// =====================================================================
// MÓDULO 3: Análise Web via Firecrawl Search (enriquecida)
// =====================================================================
async function searchWebPresence(brandName: string, businessArea: string, firecrawlKey: string): Promise<{
  googleMeuNegocio: boolean;
  linkedin: boolean;
  instagramFound: boolean;
  webMentions: number;
  sources: Array<{ title: string; url: string; snippet: string }>;
  summary: string;
  socialProfiles: Array<{ platform: string; profileName: string; url: string; followers?: string }>;
  cnpjSources: Array<{ source: string; name: string; cnpj?: string; city?: string; state?: string; status?: string }>;
}> {
  const emptyResult = {
    googleMeuNegocio: false, linkedin: false, instagramFound: false,
    webMentions: 0, sources: [], summary: 'Análise web não disponível.',
    socialProfiles: [], cnpjSources: []
  };

  if (!firecrawlKey) return emptyResult;

  try {
    console.log('[WEB] Iniciando análise de presença web enriquecida via Firecrawl...');

    const [generalSearch, linkedinSearch, instagramSearch, cnpjSearch] = await Promise.allSettled([
      fetch('https://api.firecrawl.dev/v1/search', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${firecrawlKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `"${brandName}" empresa negócio ${businessArea} Brasil`,
          limit: 8,
          scrapeOptions: { formats: ['markdown'] }
        })
      }),
      fetch('https://api.firecrawl.dev/v1/search', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${firecrawlKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `"${brandName}" site:linkedin.com/company OR site:maps.google.com`,
          limit: 5,
          scrapeOptions: { formats: ['markdown'] }
        })
      }),
      fetch('https://api.firecrawl.dev/v1/search', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${firecrawlKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: `"${brandName}" site:instagram.com`, limit: 3 })
      }),
      fetch('https://api.firecrawl.dev/v1/search', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${firecrawlKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `"${brandName}" site:cnpja.com OR site:cnpj.ws OR site:serasa.com.br OR site:cnpjcheck.com.br`,
          limit: 5,
          scrapeOptions: { formats: ['markdown'] }
        })
      }),
    ]);

    let allSources: Array<{ title: string; url: string; snippet: string }> = [];
    let googleFound = false;
    let linkedinFound = false;
    let instagramFound = false;
    const socialProfiles: Array<{ platform: string; profileName: string; url: string; followers?: string }> = [];
    const cnpjSources: Array<{ source: string; name: string; cnpj?: string; city?: string; state?: string; status?: string }> = [];

    if (generalSearch.status === 'fulfilled' && generalSearch.value.ok) {
      const data = await generalSearch.value.json();
      const results = data.data || [];
      for (const r of results) {
        const url = r.url || '';
        if (url.includes('google.com/maps') || url.includes('goo.gl/maps') || url.includes('maps.app.goo.gl')) googleFound = true;
        if (url.includes('linkedin.com')) {
          linkedinFound = true;
          const profileName = r.metadata?.title || r.title || brandName;
          if (!socialProfiles.find(p => p.platform === 'LinkedIn')) {
            socialProfiles.push({ platform: 'LinkedIn', profileName: profileName.substring(0, 40), url });
          }
        }
        allSources.push({ title: r.metadata?.title || r.title || '', url, snippet: (r.markdown || '').substring(0, 200) });
      }
    }

    if (linkedinSearch.status === 'fulfilled' && linkedinSearch.value.ok) {
      const data = await linkedinSearch.value.json();
      const results = data.data || [];
      for (const r of results) {
        const url = r.url || '';
        if (url.includes('linkedin.com')) {
          linkedinFound = true;
          const profileName = r.metadata?.title || r.title || brandName;
          if (!socialProfiles.find(p => p.platform === 'LinkedIn')) {
            socialProfiles.push({ platform: 'LinkedIn', profileName: profileName.substring(0, 40), url });
          }
        }
        if (url.includes('google.com/maps') || url.includes('maps.')) googleFound = true;
      }
    }

    if (instagramSearch.status === 'fulfilled' && instagramSearch.value.ok) {
      const data = await instagramSearch.value.json();
      const results = data.data || [];
      for (const r of results) {
        const url = r.url || '';
        if (url.includes('instagram.com')) {
          instagramFound = true;
          const profileName = r.metadata?.title || r.title || brandName;
          const handleMatch = url.match(/instagram\.com\/([^/?#]+)/);
          const handle = handleMatch ? `@${handleMatch[1]}` : profileName.substring(0, 40);
          if (!socialProfiles.find(p => p.platform === 'Instagram')) {
            socialProfiles.push({ platform: 'Instagram', profileName: handle, url });
          }
        }
      }
    }

    if (cnpjSearch.status === 'fulfilled' && cnpjSearch.value.ok) {
      const data = await cnpjSearch.value.json();
      const results = data.data || [];
      for (const r of results) {
        const url = r.url || '';
        const title = r.metadata?.title || r.title || '';
        const snippet = r.markdown || r.description || '';
        let source = 'Web';
        if (url.includes('cnpja.com')) source = 'CNPJá';
        else if (url.includes('cnpj.ws')) source = 'CNPJ.ws';
        else if (url.includes('serasa.com.br')) source = 'Serasa Experian';
        else if (url.includes('cnpjcheck.com.br')) source = 'CNPJCheck';
        const cnpjMatch = snippet.match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/);
        const cnpj = cnpjMatch ? cnpjMatch[0] : undefined;
        const nameClean = title.replace(/- CNPJ.*$/i, '').replace(/\| .*$/i, '').trim().substring(0, 50);
        if (nameClean && normalizeString(nameClean).includes(normalizeString(brandName).substring(0, 4))) {
          cnpjSources.push({ source, name: nameClean, cnpj, status: 'Verificar no portal' });
        }
      }
    }

    const webMentions = allSources.length;
    console.log(`[WEB] Menções: ${webMentions} | Google: ${googleFound} | LinkedIn: ${linkedinFound} | Instagram: ${instagramFound}`);

    const summary = webMentions > 3
      ? `A marca "${brandName}" possui presença consolidada na web com ${webMentions} menções identificadas.${googleFound ? ' Detectada no Google Maps/Negócios.' : ''}${linkedinFound ? ' Detectada no LinkedIn.' : ''}${instagramFound ? ' Detectada no Instagram.' : ''}`
      : webMentions > 0
      ? `A marca "${brandName}" possui presença limitada na web com ${webMentions} menções.${instagramFound ? ' Detectada no Instagram.' : ''}`
      : `Não foram encontradas menções significativas da marca "${brandName}" na web.`;

    return { googleMeuNegocio: googleFound, linkedin: linkedinFound, instagramFound, webMentions, sources: allSources.slice(0, 6), summary, socialProfiles, cnpjSources: cnpjSources.slice(0, 5) };
  } catch (err) {
    console.error('[WEB] Erro análise web:', err);
    return emptyResult;
  }
}

// =====================================================================
// MÓDULO 4 (NOVO): Pesquisa de Colidência Web Dedicada via Firecrawl
// Executada ANTES do laudo para enriquecer o contexto da IA
// =====================================================================
async function searchBrandCollision(brandName: string, businessArea: string, firecrawlKey: string): Promise<string> {
  if (!firecrawlKey) return '';

  try {
    console.log('[COLISÃO] Iniciando pesquisa de colidência web dedicada...');

    const [googleSearch, trademarkSearch] = await Promise.allSettled([
      fetch('https://api.firecrawl.dev/v1/search', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${firecrawlKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `marca registrada "${brandName}" ${businessArea} INPI colidência`,
          limit: 5,
          scrapeOptions: { formats: ['markdown'] }
        })
      }),
      fetch('https://api.firecrawl.dev/v1/search', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${firecrawlKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `"${brandName}" trademark registered brand ${businessArea} Brazil`,
          limit: 5,
          scrapeOptions: { formats: ['markdown'] }
        })
      })
    ]);

    let collisionContext = '';

    if (googleSearch.status === 'fulfilled' && googleSearch.value.ok) {
      const data = await googleSearch.value.json();
      const results = data.data || [];
      for (const r of results) {
        const snippet = (r.markdown || r.description || '').substring(0, 300);
        if (snippet) {
          collisionContext += `\n[Fonte: ${r.url || 'Web'}]\n${snippet}\n`;
        }
      }
    }

    if (trademarkSearch.status === 'fulfilled' && trademarkSearch.value.ok) {
      const data = await trademarkSearch.value.json();
      const results = data.data || [];
      for (const r of results) {
        const snippet = (r.markdown || r.description || '').substring(0, 300);
        if (snippet) {
          collisionContext += `\n[Trademark Source: ${r.url || 'Web'}]\n${snippet}\n`;
        }
      }
    }

    console.log(`[COLISÃO] Contexto de colidência obtido: ${collisionContext.length} caracteres`);
    return collisionContext.substring(0, 3000); // Limite para não exceder tokens
  } catch (err) {
    console.error('[COLISÃO] Erro na pesquisa de colidência:', err);
    return '';
  }
}

// =====================================================================
// MÓDULO 5: Geração do Laudo via GPT-5.2 (Lovable AI Gateway)
// =====================================================================
async function generateLaudo(params: {
  brandName: string;
  businessArea: string;
  classes: { classes: number[]; descriptions: string[] };
  inpiResults: { found: boolean; totalResults: number; conflicts: any[]; source: string };
  companiesResult: { found: boolean; companies: any[]; total: number };
  webResult: { googleMeuNegocio: boolean; linkedin: boolean; webMentions: number; sources: any[]; summary: string };
  collisionWebContext: string;
  lovableApiKey: string;
}): Promise<{
  laudo: string;
  level: 'high' | 'medium' | 'low' | 'blocked';
  title: string;
  description: string;
  urgencyScore: number;
}> {
  const { brandName, businessArea, classes, inpiResults, companiesResult, webResult, collisionWebContext, lovableApiKey } = params;

  const contextData = `
DADOS DA CONSULTA:
- Marca consultada: "${brandName}"
- Ramo de atividade: "${businessArea}"
- Classes NCL sugeridas: ${classes.classes.join(', ')} (${classes.descriptions.join(' | ')})

RESULTADO DA BUSCA INPI (${inpiResults.source}):
- Marcas colidentes encontradas: ${inpiResults.totalResults}
- Colidências detectadas: ${inpiResults.conflicts.length > 0 ? inpiResults.conflicts.map(c => `${c.marca} (${c.situacao}, Titular: ${c.titular}, País: ${c.pais}, Classe: ${c.classe})`).join('; ') : 'Nenhuma colidência direta encontrada'}

RESULTADO DA BUSCA DE EMPRESAS BRASILEIRAS (Receita Federal):
- Empresas com nome similar encontradas: ${companiesResult.total}
- Empresas: ${companiesResult.companies.length > 0 ? companiesResult.companies.map(c => `${c.name} (CNPJ: ${c.cnpj}, Status: ${c.status}, ${c.city}/${c.state})`).join('; ') : 'Nenhuma empresa com nome idêntico ou similar encontrada'}

ANÁLISE DE PRESENÇA WEB:
- Menções encontradas na web: ${webResult.webMentions}
- Google Meu Negócio / Maps: ${webResult.googleMeuNegocio ? 'SIM - detectado' : 'NÃO detectado'}
- LinkedIn: ${webResult.linkedin ? 'SIM - detectado' : 'NÃO detectado'}
- Resumo: ${webResult.summary}

PESQUISA DE COLIDÊNCIA WEB (Google Search em tempo real):
${collisionWebContext || 'Nenhum resultado adicional de colidência encontrado via pesquisa web.'}
`;

  const prompt = `Você é um especialista sênior em Propriedade Intelectual com 20 anos de experiência no INPI e em registro de marcas no Brasil. Você foi contratado para emitir um Laudo Técnico de Viabilidade de Marca. Não inclua nome de especialista, assinatura ou separadores de linha (━━) no texto do laudo.

${contextData}

Com base nos dados acima (incluindo a pesquisa de colidência web em tempo real), elabore um LAUDO TÉCNICO COMPLETO e PROFISSIONAL seguindo EXATAMENTE este formato:

1. IDENTIFICAÇÃO DA MARCA
   • Nome da marca: [nome]
   • Ramo de atividade: [ramo]
   • Classes NCL recomendadas: [classes]

2. METODOLOGIA E FONTES CONSULTADAS
   Descreva as fontes consultadas (INPI/WIPO, Receita Federal, análise web, pesquisa de colidência Google em tempo real).

3. ANÁLISE DA BASE DO INPI
   Descreva detalhadamente os resultados da busca no INPI. Se encontrou colidências, liste-as com detalhes técnicos jurídicos. Se não encontrou, explique o que isso significa.

4. ANÁLISE DE COLIDÊNCIA EMPRESARIAL
   Descreva se existem empresas com nome idêntico ou similar registradas na Receita Federal do Brasil. Analise o risco de colidência empresarial.

5. ANÁLISE DE PRESENÇA WEB E MERCADO
   Descreva a presença da marca na internet, Google Meu Negócio, LinkedIn e outros meios digitais. Avalie o risco de confusão do consumidor. Use os dados da pesquisa de colidência web em tempo real para enriquecer a análise.

6. PARECER TÉCNICO-JURÍDICO
   Emita um parecer técnico detalhado baseado nos dados reais coletados. Use linguagem jurídica adequada. Mencione artigos da Lei de Propriedade Industrial (Lei 9.279/96) relevantes. Analise os dados da pesquisa web em tempo real.

7. NÍVEL DE RISCO E URGÊNCIA
   Classifique o risco de forma clara: BAIXO / MÉDIO / ALTO. Dê um SCORE DE URGÊNCIA de 0 a 100 onde 100 = urgência máxima de registrar.

8. RECOMENDAÇÃO FINAL
   Dê uma recomendação clara e objetiva sobre o que o cliente deve fazer. Se houver colidências, enfatize com URGÊNCIA que o dono da marca é quem registra PRIMEIRO (Lei 9.279/96, art. 129).

9. AVISO LEGAL
   Inclua aviso padrão sobre limitações da análise prévia. Não inclua assinatura, nome de especialista ou separadores de linha no final do laudo.

Após o laudo, forneça em JSON (em uma linha separada, começando com ###JSON###):
###JSON###{"level":"high|medium|low|blocked","title":"Título do resultado","description":"Descrição curta 1-2 frases","urgencyScore":0-100}`;

  try {
    console.log('[LAUDO] Gerando laudo via GPT-5.2 (Lovable AI Gateway)...');
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-5.2',
        messages: [
          { role: 'system', content: 'Você é um especialista sênior em Propriedade Intelectual da WebMarcas. Responda de forma técnica, jurídica e profissional. Seja específico e baseie-se APENAS nos dados reais fornecidos, sem inventar informações. Não inclua assinatura, nome de especialista ou separadores de linha no final do texto.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.4,
        max_completion_tokens: 3500,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AI Gateway error: ${response.status} — ${errText}`);
    }

    const data = await response.json();
    const content: string = data.choices?.[0]?.message?.content || '';
    console.log('[LAUDO] Laudo gerado com sucesso via GPT-5.2');

    const jsonMatch = content.match(/###JSON###({.+})/s);
    let level: 'high' | 'medium' | 'low' | 'blocked' = 'medium';
    let title = 'Análise de Viabilidade Concluída';
    let description = 'Análise técnica realizada com base em dados reais.';
    let urgencyScore = 50;

    if (jsonMatch) {
      try {
        const meta = JSON.parse(jsonMatch[1]);
        level = meta.level || 'medium';
        title = meta.title || title;
        description = meta.description || description;
        urgencyScore = meta.urgencyScore || 50;
      } catch (e) { console.error('[LAUDO] Erro ao parsear JSON meta:', e); }
    }

    const laudoText = content.replace(/###JSON###.+$/s, '').trim();
    return { laudo: laudoText, level, title, description, urgencyScore };
  } catch (error) {
    console.error('[LAUDO] Erro ao gerar laudo:', error);
    // Fallback sem IA
    const hasConflict = inpiResults.found || companiesResult.found;
    const level = hasConflict ? 'medium' : 'high';
    const urgencyScore = hasConflict ? 75 : 35;
    return {
      laudo: `LAUDO TÉCNICO DE VIABILIDADE — WEBMARCAS\nProtocolo: WM-${Date.now().toString(36).toUpperCase()}\nData: ${new Date().toLocaleDateString('pt-BR')}\n\n1. IDENTIFICAÇÃO\nMarca: "${brandName}" | Ramo: "${businessArea}"\n\n2. ANÁLISE INPI\n${inpiResults.found ? `Foram encontradas ${inpiResults.totalResults} marca(s) similares na base do INPI. Risco de colidência identificado.` : 'Nenhuma colidência direta encontrada na base do INPI para esta marca.'}\n\n3. ANÁLISE EMPRESARIAL\n${companiesResult.found ? `Encontradas ${companiesResult.total} empresa(s) com nome similar na Receita Federal.` : 'Nenhuma empresa com nome idêntico encontrada na Receita Federal.'}\n\n4. PRESENÇA WEB\n${webResult.summary}\n\n5. RECOMENDAÇÃO\n${hasConflict ? '⚠️ ATENÇÃO: Foram identificadas possíveis colidências. Recomenda-se consulta especializada antes do protocolo. O dono da marca é quem registra PRIMEIRO.' : '✅ A marca apresenta boa viabilidade de registro. Recomendamos protocolar o pedido o quanto antes para garantir a prioridade.'}`,
      level,
      title: hasConflict ? 'Atenção: Possíveis Colidências Detectadas' : 'Marca com Boa Viabilidade',
      description: hasConflict ? 'Foram encontradas referências similares. Análise especializada recomendada.' : 'Sua marca apresenta boa viabilidade de registro.',
      urgencyScore
    };
  }
}

// =====================================================================
// HANDLER PRINCIPAL
// =====================================================================
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { brandName, businessArea } = await req.json();

    if (!brandName || !businessArea) {
      return new Response(JSON.stringify({ success: false, error: 'brandName e businessArea são obrigatórios' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`[MAIN] Nova consulta: "${brandName}" | "${businessArea}"`);
    console.log(`${'='.repeat(60)}\n`);

    // Checar marca famosa (base de 5.000+)
    if (isFamousBrand(brandName)) {
      console.log('[MAIN] Marca famosa detectada - bloqueando');
      return new Response(JSON.stringify({
        success: true, isFamousBrand: true,
        level: 'blocked',
        title: '🚫 Marca de Alto Renome — Registro Não Recomendado',
        description: `"${brandName}" é uma marca de alto renome internacionalmente conhecida. O registro desta marca no INPI será indeferido.`,
        laudo: `A marca "${brandName}" é reconhecida como marca de alto renome, protegida nos termos do art. 125 da Lei 9.279/96. O INPI indeferirá qualquer pedido de registro desta marca por terceiros em qualquer classe.`,
        urgencyScore: 0,
        webAnalysis: null,
        inpiResults: { found: true, totalResults: 1, conflicts: [] },
        companiesResult: { found: true, companies: [], total: 0 }
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');

    if (!lovableApiKey) {
      return new Response(JSON.stringify({ success: false, error: 'LOVABLE_API_KEY não configurada' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const classes = getClassesForBusinessArea(businessArea);

    const withTimeout = <T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> =>
      Promise.race([promise, new Promise<T>(resolve => setTimeout(() => resolve(fallback), ms))]);

    // Rodar os 4 módulos de busca em paralelo
    console.log('[MAIN] Iniciando 4 módulos de busca em paralelo...');
    const [inpiResults, companiesResult, webResult, collisionWebContext] = await Promise.all([
      withTimeout(searchINPI(brandName, firecrawlKey || ''), 20000, { found: false, totalResults: 0, conflicts: [], source: 'Timeout na consulta' }),
      withTimeout(searchCompaniesBR(brandName), 15000, { found: false, companies: [], total: 0 }),
      withTimeout(searchWebPresence(brandName, businessArea, firecrawlKey || ''), 20000, {
        googleMeuNegocio: false, linkedin: false, instagramFound: false,
        webMentions: 0, sources: [], summary: 'Análise web indisponível.',
        socialProfiles: [], cnpjSources: []
      }),
      withTimeout(searchBrandCollision(brandName, businessArea, firecrawlKey || ''), 18000, ''),
    ]);

    console.log(`[MAIN] Módulos concluídos. INPI: ${inpiResults.found}, Empresas: ${companiesResult.found}, Web: ${webResult.webMentions} menções, Colidência: ${collisionWebContext.length} chars`);

    // Gerar laudo via GPT-5.2
    const laudoResult = await generateLaudo({
      brandName, businessArea, classes, inpiResults, companiesResult, webResult,
      collisionWebContext, lovableApiKey
    });

    const response = {
      success: true,
      level: laudoResult.level,
      title: laudoResult.title,
      description: laudoResult.description,
      laudo: laudoResult.laudo,
      urgencyScore: laudoResult.urgencyScore,
      classes: classes.classes,
      classDescriptions: classes.descriptions,
      searchDate: new Date().toISOString(),
      inpiResults: {
        found: inpiResults.found,
        totalResults: inpiResults.totalResults,
        conflicts: inpiResults.conflicts,
        source: inpiResults.source
      },
      companiesResult: {
        found: companiesResult.found,
        companies: companiesResult.companies,
        total: companiesResult.total
      },
      webAnalysis: {
        googleMeuNegocio: webResult.googleMeuNegocio,
        linkedin: webResult.linkedin,
        instagramFound: webResult.instagramFound,
        webMentions: webResult.webMentions,
        sources: webResult.sources,
        summary: webResult.summary,
        socialProfiles: webResult.socialProfiles,
        cnpjSources: webResult.cnpjSources,
      }
    };

    console.log(`[MAIN] Resposta gerada: level=${response.level}, urgency=${response.urgencyScore}`);
    return new Response(JSON.stringify(response), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[MAIN] Erro crítico:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
