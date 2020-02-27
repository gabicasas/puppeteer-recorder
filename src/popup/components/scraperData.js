export default class ScraperData{


    parse(items){
       /* let result={};
        for(let i in items){
                //Si no existia con este id el objeto se crea uno nuevo
            if(!result[items[i].id])
                result[items[i].id]=[]
            for(let j in items[i].nodos){
                result[items[i].id].push(items[i].nodos[j].value)
            }    
        }*/
        let result=items;
        return result;

    }
}